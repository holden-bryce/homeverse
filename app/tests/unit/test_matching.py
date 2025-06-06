"""Unit tests for matching service"""
import pytest
from unittest.mock import AsyncMock, patch
import numpy as np

from app.services.matching import MatchingService
from app.db.models import Applicant, Project


class TestMatchingService:
    """Test matching service"""
    
    @pytest.fixture
    def matching_service(self):
        """Create matching service instance"""
        with patch.object(MatchingService, '__init__', lambda x: None):
            service = MatchingService()
            service.openai_client = AsyncMock()
            service.model = "text-embedding-3-small"
            return service
    
    def test_cosine_similarity(self, matching_service):
        """Test cosine similarity calculation"""
        vec1 = [1.0, 0.0, 0.0]
        vec2 = [1.0, 0.0, 0.0]
        
        similarity = matching_service._cosine_similarity(vec1, vec2)
        assert similarity == 1.0
        
        vec3 = [0.0, 1.0, 0.0]
        similarity = matching_service._cosine_similarity(vec1, vec3)
        assert similarity == 0.0
    
    def test_ami_compatibility_score(self, matching_service):
        """Test AMI compatibility scoring"""
        # Perfect match
        score = matching_service._ami_compatibility_score("80%", 60, 100)
        assert score == 1.0
        
        # Too low
        score = matching_service._ami_compatibility_score("50%", 60, 100)
        assert score < 1.0
        assert score > 0.0
        
        # Too high
        score = matching_service._ami_compatibility_score("120%", 60, 100)
        assert score < 1.0
        assert score > 0.0
        
        # Way off
        score = matching_service._ami_compatibility_score("30%", 80, 120)
        assert score == 0.0
    
    def test_applicant_to_text(self, matching_service):
        """Test applicant text conversion"""
        applicant = Applicant(
            household_size=3,
            ami_band="80%",
            preferences={"location": "downtown", "amenities": "pool"}
        )
        
        text = matching_service._applicant_to_text(applicant)
        
        assert "3" in text
        assert "80%" in text
        assert "downtown" in text
        assert "pool" in text
    
    def test_project_to_text(self, matching_service):
        """Test project text conversion"""
        project = Project(
            developer_name="ABC Development",
            unit_count=100,
            ami_min=60,
            ami_max=120,
            est_delivery="Q2 2024",
            metadata_json={"transit_score": 8, "green_building": True}
        )
        
        text = matching_service._project_to_text(project)
        
        assert "ABC Development" in text
        assert "100" in text
        assert "60%" in text
        assert "120%" in text
        assert "Q2 2024" in text
        assert "transit_score" in text
    
    @pytest.mark.asyncio
    async def test_generate_embedding(self, matching_service):
        """Test embedding generation"""
        # Mock OpenAI response
        mock_response = AsyncMock()
        mock_response.data = [AsyncMock()]
        mock_response.data[0].embedding = [0.1, 0.2, 0.3]
        
        matching_service.openai_client.embeddings.create.return_value = mock_response
        
        embedding = await matching_service.generate_embedding("test text")
        
        assert embedding == [0.1, 0.2, 0.3]
        matching_service.openai_client.embeddings.create.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_generate_embedding_error(self, matching_service):
        """Test embedding generation with error"""
        matching_service.openai_client.embeddings.create.side_effect = Exception("API error")
        
        embedding = await matching_service.generate_embedding("test text")
        
        # Should return default embedding on error
        assert len(embedding) == 1536
        assert all(x == 0.0 for x in embedding)