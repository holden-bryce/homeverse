"""Document ingestion service using Unstructured.io"""
import os
from typing import List, Dict, Any, Optional
from uuid import UUID
import tempfile
import httpx
from unstructured.partition.pdf import partition_pdf
from unstructured.staging.base import convert_to_dict

from app.utils.logging import get_logger

logger = get_logger("doc_ingest")


class DocumentIngestService:
    """Service for processing PDFs and extracting structured data"""
    
    def __init__(self):
        self.unstructured_api_key = os.getenv("UNSTRUCTURED_API_KEY")
        self.unstructured_url = os.getenv("UNSTRUCTURED_API_URL", "https://api.unstructured.io")
        self.use_local_processing = not self.unstructured_api_key
    
    async def process_pdf_from_url(self, pdf_url: str, document_type: str = "pitch_deck") -> Dict[str, Any]:
        """Process PDF from URL and extract structured data"""
        try:
            # Download PDF
            async with httpx.AsyncClient() as client:
                response = await client.get(pdf_url)
                response.raise_for_status()
                pdf_content = response.content
            
            return await self.process_pdf_content(pdf_content, document_type)
        
        except Exception as e:
            logger.error("Failed to process PDF from URL", url=pdf_url, error=str(e))
            return {"error": str(e), "extracted_data": {}}
    
    async def process_pdf_content(self, pdf_content: bytes, document_type: str = "pitch_deck") -> Dict[str, Any]:
        """Process PDF content and extract structured data"""
        try:
            if self.use_local_processing:
                return await self._process_locally(pdf_content, document_type)
            else:
                return await self._process_via_api(pdf_content, document_type)
        
        except Exception as e:
            logger.error("Failed to process PDF content", error=str(e))
            return {"error": str(e), "extracted_data": {}}
    
    async def _process_locally(self, pdf_content: bytes, document_type: str) -> Dict[str, Any]:
        """Process PDF using local Unstructured installation"""
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_file:
            temp_file.write(pdf_content)
            temp_file.flush()
            
            try:
                # Partition the PDF
                elements = partition_pdf(
                    filename=temp_file.name,
                    strategy="hi_res",
                    infer_table_structure=True,
                    chunking_strategy="by_title",
                    max_characters=4000,
                    new_after_n_chars=3800,
                    combine_text_under_n_chars=2000
                )
                
                # Convert to dictionary format
                element_dicts = convert_to_dict(elements)
                
                # Extract structured data based on document type
                extracted_data = self._extract_structured_data(element_dicts, document_type)
                
                return {
                    "extracted_data": extracted_data,
                    "raw_elements": element_dicts,
                    "processing_method": "local"
                }
            
            finally:
                os.unlink(temp_file.name)
    
    async def _process_via_api(self, pdf_content: bytes, document_type: str) -> Dict[str, Any]:
        """Process PDF using Unstructured.io API"""
        async with httpx.AsyncClient() as client:
            files = {"files": ("document.pdf", pdf_content, "application/pdf")}
            headers = {"Authorization": f"Bearer {self.unstructured_api_key}"}
            
            data = {
                "strategy": "hi_res",
                "chunking_strategy": "by_title",
                "max_characters": "4000",
                "new_after_n_chars": "3800",
                "combine_text_under_n_chars": "2000"
            }
            
            response = await client.post(
                f"{self.unstructured_url}/general/v0/general",
                files=files,
                data=data,
                headers=headers,
                timeout=60.0
            )
            
            response.raise_for_status()
            element_dicts = response.json()
            
            # Extract structured data
            extracted_data = self._extract_structured_data(element_dicts, document_type)
            
            return {
                "extracted_data": extracted_data,
                "raw_elements": element_dicts,
                "processing_method": "api"
            }
    
    def _extract_structured_data(self, elements: List[Dict], document_type: str) -> Dict[str, Any]:
        """Extract structured data based on document type"""
        if document_type == "pitch_deck":
            return self._extract_pitch_deck_data(elements)
        elif document_type == "municipal_doc":
            return self._extract_municipal_data(elements)
        else:
            return self._extract_generic_data(elements)
    
    def _extract_pitch_deck_data(self, elements: List[Dict]) -> Dict[str, Any]:
        """Extract data from developer pitch decks"""
        extracted = {
            "project_name": None,
            "developer_name": None,
            "location": None,
            "unit_count": None,
            "ami_info": {},
            "timeline": {},
            "financing": {},
            "key_features": [],
            "contact_info": {}
        }
        
        text_content = " ".join([elem.get("text", "") for elem in elements])
        
        # Use simple keyword matching (could be enhanced with NLP)
        extracted.update(self._extract_project_details(text_content))
        
        return extracted
    
    def _extract_municipal_data(self, elements: List[Dict]) -> Dict[str, Any]:
        """Extract data from municipal documents"""
        extracted = {
            "document_type": None,
            "jurisdiction": None,
            "zoning_info": {},
            "affordable_housing_requirements": {},
            "development_standards": {},
            "approval_process": {},
            "fees_and_timelines": {}
        }
        
        text_content = " ".join([elem.get("text", "") for elem in elements])
        
        # Extract municipal-specific information
        extracted.update(self._extract_municipal_details(text_content))
        
        return extracted
    
    def _extract_generic_data(self, elements: List[Dict]) -> Dict[str, Any]:
        """Extract generic document data"""
        return {
            "title": self._extract_title(elements),
            "summary": self._extract_summary(elements),
            "key_points": self._extract_key_points(elements),
            "tables": self._extract_tables(elements),
            "metadata": {
                "total_elements": len(elements),
                "text_elements": len([e for e in elements if e.get("type") == "NarrativeText"]),
                "table_elements": len([e for e in elements if e.get("type") == "Table"])
            }
        }
    
    def _extract_project_details(self, text: str) -> Dict[str, Any]:
        """Extract project details using keyword matching"""
        import re
        
        details = {}
        
        # Project name (look for title-like patterns)
        name_patterns = [
            r"Project:\s*([^\n]+)",
            r"Development:\s*([^\n]+)",
            r"^([A-Z][^.!?]*(?:Project|Development|Community|Village|Place))"
        ]
        
        for pattern in name_patterns:
            match = re.search(pattern, text, re.MULTILINE | re.IGNORECASE)
            if match:
                details["project_name"] = match.group(1).strip()
                break
        
        # Unit count
        unit_match = re.search(r"(\d+)\s*units?", text, re.IGNORECASE)
        if unit_match:
            details["unit_count"] = int(unit_match.group(1))
        
        # AMI information
        ami_matches = re.findall(r"(\d+)%\s*AMI", text, re.IGNORECASE)
        if ami_matches:
            details["ami_info"] = {"ami_levels": [f"{ami}%" for ami in ami_matches]}
        
        # Location
        location_patterns = [
            r"Location:\s*([^\n]+)",
            r"Address:\s*([^\n]+)",
            r"([A-Za-z\s]+,\s*[A-Z]{2})"
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, text, re.MULTILINE)
            if match:
                details["location"] = match.group(1).strip()
                break
        
        return details
    
    def _extract_municipal_details(self, text: str) -> Dict[str, Any]:
        """Extract municipal document details"""
        import re
        
        details = {}
        
        # Zoning information
        zoning_match = re.search(r"zoning[:\s]+([^\n.]+)", text, re.IGNORECASE)
        if zoning_match:
            details["zoning_info"] = {"classification": zoning_match.group(1).strip()}
        
        # Affordable housing requirements
        affordable_matches = re.findall(
            r"affordable housing[:\s]+([^\n.]+)", text, re.IGNORECASE
        )
        if affordable_matches:
            details["affordable_housing_requirements"] = {
                "requirements": affordable_matches
            }
        
        return details
    
    def _extract_title(self, elements: List[Dict]) -> Optional[str]:
        """Extract document title"""
        for element in elements:
            if element.get("type") == "Title":
                return element.get("text", "").strip()
        return None
    
    def _extract_summary(self, elements: List[Dict]) -> str:
        """Extract document summary (first few narrative text elements)"""
        narrative_texts = [
            elem.get("text", "") for elem in elements 
            if elem.get("type") == "NarrativeText"
        ]
        
        # Take first 500 characters of narrative text
        summary_text = " ".join(narrative_texts)
        return summary_text[:500] + "..." if len(summary_text) > 500 else summary_text
    
    def _extract_key_points(self, elements: List[Dict]) -> List[str]:
        """Extract key points (list items, headers)"""
        key_points = []
        
        for element in elements:
            if element.get("type") in ["ListItem", "Header"]:
                text = element.get("text", "").strip()
                if text and len(text) < 200:  # Reasonable key point length
                    key_points.append(text)
        
        return key_points[:10]  # Limit to top 10
    
    def _extract_tables(self, elements: List[Dict]) -> List[Dict]:
        """Extract table data"""
        tables = []
        
        for element in elements:
            if element.get("type") == "Table":
                tables.append({
                    "text": element.get("text", ""),
                    "metadata": element.get("metadata", {})
                })
        
        return tables