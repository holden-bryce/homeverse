"""Demand-supply AI matching service"""
import numpy as np
from typing import List, Dict, Tuple, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from openai import AsyncOpenAI
import os

from app.db.models import Applicant, Project, Match
from app.db.crud import create_match, get_matches_for_applicant
from app.utils.logging import get_logger

logger = get_logger("matching")


class MatchingService:
    """AI-powered matching service for applicants and projects"""
    
    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = "text-embedding-3-small"
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using OpenAI"""
        try:
            response = await self.openai_client.embeddings.create(
                model=self.model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error("Failed to generate embedding", error=str(e))
            return [0.0] * 1536  # Default embedding size
    
    def _applicant_to_text(self, applicant: Applicant) -> str:
        """Convert applicant to text for embedding"""
        preferences_text = " ".join([
            f"{k}: {v}" for k, v in applicant.preferences.items()
        ])
        
        return f"""
        Household size: {applicant.household_size}
        AMI band: {applicant.ami_band}
        Preferences: {preferences_text}
        """.strip()
    
    def _project_to_text(self, project: Project) -> str:
        """Convert project to text for embedding"""
        metadata_text = " ".join([
            f"{k}: {v}" for k, v in project.metadata_json.items()
        ])
        
        return f"""
        Developer: {project.developer_name}
        Units: {project.unit_count}
        AMI range: {project.ami_min}% to {project.ami_max}%
        Delivery: {project.est_delivery or 'TBD'}
        Features: {metadata_text}
        """.strip()
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        a = np.array(vec1)
        b = np.array(vec2)
        
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        return dot_product / (norm_a * norm_b)
    
    def _ami_compatibility_score(self, applicant_ami: str, project_ami_min: int, project_ami_max: int) -> float:
        """Calculate AMI compatibility score"""
        try:
            applicant_pct = int(applicant_ami.rstrip('%'))
            if project_ami_min <= applicant_pct <= project_ami_max:
                return 1.0
            else:
                # Partial score based on distance
                if applicant_pct < project_ami_min:
                    distance = project_ami_min - applicant_pct
                else:
                    distance = applicant_pct - project_ami_max
                
                # Decrease score based on distance
                return max(0.0, 1.0 - (distance / 50.0))
        except ValueError:
            return 0.5  # Default score if parsing fails
    
    async def match_applicant_to_projects(
        self,
        session: AsyncSession,
        applicant: Applicant,
        projects: List[Project],
        top_n: int = 10
    ) -> List[Dict]:
        """Match an applicant to projects and return scored results"""
        if not projects:
            return []
        
        # Generate embeddings
        applicant_text = self._applicant_to_text(applicant)
        applicant_embedding = await self.generate_embedding(applicant_text)
        
        matches = []
        
        for project in projects:
            # Hard filter: AMI compatibility
            ami_score = self._ami_compatibility_score(
                applicant.ami_band,
                project.ami_min,
                project.ami_max
            )
            
            if ami_score < 0.3:  # Skip if very low AMI compatibility
                continue
            
            # Generate project embedding and calculate similarity
            project_text = self._project_to_text(project)
            project_embedding = await self.generate_embedding(project_text)
            
            similarity_score = self._cosine_similarity(
                applicant_embedding,
                project_embedding
            )
            
            # Combined score (weighted)
            final_score = (similarity_score * 0.7) + (ami_score * 0.3)
            
            matches.append({
                "project": project,
                "score": final_score,
                "ami_score": ami_score,
                "similarity_score": similarity_score
            })
        
        # Sort by score and return top N
        matches.sort(key=lambda x: x["score"], reverse=True)
        return matches[:top_n]
    
    async def create_matches_for_applicant(
        self,
        session: AsyncSession,
        applicant: Applicant,
        projects: List[Project],
        company_id: UUID
    ) -> List[Match]:
        """Create match records for an applicant"""
        match_results = await self.match_applicant_to_projects(
            session, applicant, projects
        )
        
        created_matches = []
        
        for result in match_results:
            project = result["project"]
            score = result["score"]
            
            # Create match record
            match = await create_match(
                session=session,
                company_id=company_id,
                applicant_id=applicant.id,
                project_id=project.id,
                score=score,
                metadata={
                    "ami_score": result["ami_score"],
                    "similarity_score": result["similarity_score"],
                    "algorithm_version": "v1.0"
                }
            )
            created_matches.append(match)
        
        logger.info(
            "Created matches for applicant",
            applicant_id=str(applicant.id),
            matches_created=len(created_matches)
        )
        
        return created_matches
    
    async def batch_match_applicants(
        self,
        session: AsyncSession,
        applicants: List[Applicant],
        projects: List[Project],
        company_id: UUID
    ) -> Dict[str, int]:
        """Batch process matches for multiple applicants"""
        total_matches = 0
        
        for applicant in applicants:
            matches = await self.create_matches_for_applicant(
                session, applicant, projects, company_id
            )
            total_matches += len(matches)
        
        return {
            "applicants_processed": len(applicants),
            "total_matches_created": total_matches
        }