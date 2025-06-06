"""Integration test for matching service"""
import pytest
from unittest.mock import patch, AsyncMock

from app.services.matching import MatchingService


class TestMatchingIntegration:
    """Integration test for matching service with database"""
    
    @pytest.mark.asyncio
    async def test_match_applicant_to_projects_integration(
        self,
        test_session,
        test_applicants,
        test_projects,
        test_company
    ):
        """Test end-to-end matching with real database data"""
        
        # Mock OpenAI embeddings
        with patch.object(MatchingService, 'generate_embedding') as mock_embedding:
            # Return different embeddings for different inputs
            def embedding_side_effect(text):
                if "downtown" in text.lower():
                    return [0.8, 0.1, 0.1]  # High similarity for downtown preference
                elif "midtown" in text.lower():
                    return [0.1, 0.8, 0.1]  # High similarity for midtown
                else:
                    return [0.1, 0.1, 0.8]  # Default embedding
            
            mock_embedding.side_effect = embedding_side_effect
            
            # Initialize matching service
            matching_service = MatchingService()
            
            # Test matching for first applicant
            applicant = test_applicants[0]  # 80% AMI applicant
            matches = await matching_service.match_applicant_to_projects(
                test_session,
                applicant,
                test_projects,
                top_n=5
            )
            
            # Should find matches
            assert len(matches) > 0
            
            # Check that scores are reasonable
            for match in matches:
                assert 0.0 <= match["score"] <= 1.0
                assert "ami_score" in match
                assert "similarity_score" in match
            
            # Matches should be sorted by score (highest first)
            scores = [match["score"] for match in matches]
            assert scores == sorted(scores, reverse=True)
    
    @pytest.mark.asyncio
    async def test_create_matches_for_applicant_integration(
        self,
        test_session,
        test_applicants,
        test_projects,
        test_company
    ):
        """Test creating match records in database"""
        
        with patch.object(MatchingService, 'generate_embedding') as mock_embedding:
            mock_embedding.return_value = [0.5, 0.5, 0.0]
            
            matching_service = MatchingService()
            
            applicant = test_applicants[0]
            created_matches = await matching_service.create_matches_for_applicant(
                test_session,
                applicant,
                test_projects,
                test_company.id
            )
            
            # Should create match records
            assert len(created_matches) > 0
            
            # Verify matches are in database
            from app.db.crud import get_matches_for_applicant
            db_matches = await get_matches_for_applicant(
                test_session,
                applicant.id,
                test_company.id
            )
            
            assert len(db_matches) == len(created_matches)
            
            # Verify match properties
            for match in db_matches:
                assert match.applicant_id == applicant.id
                assert match.company_id == test_company.id
                assert 0.0 <= match.score <= 1.0
                assert "algorithm_version" in match.metadata
    
    @pytest.mark.asyncio
    async def test_batch_match_applicants_integration(
        self,
        test_session,
        test_applicants,
        test_projects,
        test_company
    ):
        """Test batch matching for multiple applicants"""
        
        with patch.object(MatchingService, 'generate_embedding') as mock_embedding:
            mock_embedding.return_value = [0.5, 0.5, 0.0]
            
            matching_service = MatchingService()
            
            result = await matching_service.batch_match_applicants(
                test_session,
                test_applicants,
                test_projects,
                test_company.id
            )
            
            # Should process all applicants
            assert result["applicants_processed"] == len(test_applicants)
            assert result["total_matches_created"] > 0
            
            # Verify matches exist for each applicant
            from app.db.crud import get_matches_for_applicant
            
            for applicant in test_applicants:
                matches = await get_matches_for_applicant(
                    test_session,
                    applicant.id,
                    test_company.id
                )
                assert len(matches) > 0