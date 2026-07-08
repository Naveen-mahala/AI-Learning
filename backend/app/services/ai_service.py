import os
import json
import logging
import urllib.request
import urllib.error
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

from app.config import settings
from app.services.prompt_service import (
    SYSTEM_PROMPT, 
    get_user_prompt, 
    CONCEPT_SYSTEM_PROMPT, 
    get_concept_user_prompt,
    REVISION_SYSTEM_PROMPT,
    get_revision_user_prompt,
    IMPORTANT_QUESTIONS_SYSTEM_PROMPT,
    get_important_questions_user_prompt
)

logger = logging.getLogger(__name__)

class AIProviderError(Exception):
    """Custom exception for AI provider errors."""
    pass

class BaseAIProvider(ABC):
    @abstractmethod
    def generate_summary(self, title: str, text: str) -> Dict[str, Any]:
        """
        Generate a structured summary from the given document content.
        Returns:
            Dict representing the generated JSON learning package.
        """
        pass

    @abstractmethod
    def generate_concepts(self, title: str, text: str) -> Dict[str, Any]:
        """
        Generate a structured concept map/knowledge layer from the given document content.
        Returns:
            Dict representing the generated JSON concept package.
        """
        pass

    @abstractmethod
    def generate_revision(self, title: str, text: str, revision_time: str) -> Dict[str, Any]:
        """
        Generate a structured revision notes package from the given document content.
        Returns:
            Dict representing the generated JSON revision package.
        """
        pass

    @abstractmethod
    def generate_important_questions(self, title: str, text: str, question_mode: str) -> Dict[str, Any]:
        """
        Generate a structured important questions package from the given document content.
        Returns:
            Dict representing the generated JSON important questions package.
        """
        pass

    def _call_api_with_retry(self, req, timeout=120, max_retries=3, initial_delay=3) -> Dict[str, Any]:
        """
        Executes urllib request with exponential backoff for HTTP 429 rate limit errors or server errors.
        """
        import time
        delay = initial_delay
        for attempt in range(max_retries):
            try:
                with urllib.request.urlopen(req, timeout=timeout) as response:
                    return json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as e:
                if e.code in [429, 500, 502, 503, 504] and attempt < max_retries - 1:
                    logger.warning(f"AI API returned status {e.code}. Retrying in {delay}s (Attempt {attempt+1}/{max_retries})...")
                    time.sleep(delay)
                    delay *= 2
                else:
                    raise e

    def _clean_and_parse_json(self, response_text: str) -> Dict[str, Any]:
        """
        Cleans markdown JSON wrappers and parses the output.
        """
        cleaned = response_text.strip()
        
        # Locate the JSON block bounds
        start_idx = cleaned.find('{')
        end_idx = cleaned.rfind('}')
        
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            cleaned = cleaned[start_idx:end_idx + 1]
            
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            # Fallback to general clean/strip just in case
            cleaned_fallback = response_text.strip()
            if cleaned_fallback.startswith("```json"):
                cleaned_fallback = cleaned_fallback[7:]
            elif cleaned_fallback.startswith("```"):
                cleaned_fallback = cleaned_fallback[3:]
            if cleaned_fallback.endswith("```"):
                cleaned_fallback = cleaned_fallback[:-3]
            cleaned_fallback = cleaned_fallback.strip()
            try:
                return json.loads(cleaned_fallback)
            except Exception:
                logger.error(f"JSON decode failure. Raw output: {response_text}")
                raise AIProviderError(f"AI response did not contain valid JSON: {str(e)}")


class GoogleAIProvider(BaseAIProvider):
    """Google AI Studio (Gemini API) integration."""
    
    def generate_summary(self, title: str, text: str) -> Dict[str, Any]:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise AIProviderError("GEMINI_API_KEY is not configured.")
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": get_user_prompt(title, text)}]
                }
            ],
            "systemInstruction": {
                "parts": [{"text": SYSTEM_PROMPT}]
            },
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        headers = {"Content-Type": "application/json"}
        
        try:
            logger.info("Calling Google AI Studio (Gemini 2.5 Flash)...")
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            
            # 120 seconds timeout with retry
            result = self._call_api_with_retry(req, timeout=120)
                
            candidates = result.get("candidates", [])
            if not candidates:
                raise AIProviderError("No response content generated from Gemini.")
                
            content_text = candidates[0]["content"]["parts"][0]["text"]
            return self._clean_and_parse_json(content_text)
            
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else ""
            logger.error(f"Gemini API returned status {e.code}. Details: {error_body}")
            raise AIProviderError(f"Gemini API HTTP Error {e.code}: {e.reason}")
        except Exception as e:
            logger.error(f"Error communicating with Gemini: {str(e)}")
            raise AIProviderError(f"Gemini integration error: {str(e)}")

    def generate_concepts(self, title: str, text: str) -> Dict[str, Any]:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise AIProviderError("GEMINI_API_KEY is not configured.")
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": get_concept_user_prompt(title, text)}]
                }
            ],
            "systemInstruction": {
                "parts": [{"text": CONCEPT_SYSTEM_PROMPT}]
            },
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        headers = {"Content-Type": "application/json"}
        
        try:
            logger.info("Calling Google AI Studio for Concept Extraction (Gemini 2.5 Flash)...")
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            
            result = self._call_api_with_retry(req, timeout=120)
                
            candidates = result.get("candidates", [])
            if not candidates:
                raise AIProviderError("No response content generated from Gemini.")
                
            content_text = candidates[0]["content"]["parts"][0]["text"]
            return self._clean_and_parse_json(content_text)
            
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else ""
            logger.error(f"Gemini API returned status {e.code}. Details: {error_body}")
            raise AIProviderError(f"Gemini API HTTP Error {e.code}: {e.reason}")
        except Exception as e:
            logger.error(f"Error communicating with Gemini: {str(e)}")
            raise AIProviderError(f"Gemini integration error: {str(e)}")

    def generate_revision(self, title: str, text: str, revision_time: str) -> Dict[str, Any]:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise AIProviderError("GEMINI_API_KEY is not configured.")
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": get_revision_user_prompt(title, text)}]
                }
            ],
            "systemInstruction": {
                "parts": [{"text": REVISION_SYSTEM_PROMPT.format(revision_time=revision_time)}]
            },
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        headers = {"Content-Type": "application/json"}
        
        try:
            logger.info(f"Calling Google AI Studio for Revision Notes ({revision_time})...")
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            
            result = self._call_api_with_retry(req, timeout=120)
                
            candidates = result.get("candidates", [])
            if not candidates:
                raise AIProviderError("No response content generated from Gemini.")
                
            content_text = candidates[0]["content"]["parts"][0]["text"]
            return self._clean_and_parse_json(content_text)
            
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else ""
            logger.error(f"Gemini API returned status {e.code}. Details: {error_body}")
            raise AIProviderError(f"Gemini API HTTP Error {e.code}: {e.reason}")
        except Exception as e:
            logger.error(f"Error communicating with Gemini: {str(e)}")
            raise AIProviderError(f"Gemini integration error: {str(e)}")

    def generate_important_questions(self, title: str, text: str, question_mode: str) -> Dict[str, Any]:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise AIProviderError("GEMINI_API_KEY is not configured.")
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": get_important_questions_user_prompt(title, text, question_mode)}]
                }
            ],
            "systemInstruction": {
                "parts": [{"text": IMPORTANT_QUESTIONS_SYSTEM_PROMPT}]
            },
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        headers = {"Content-Type": "application/json"}
        
        try:
            logger.info(f"Calling Google AI Studio for Important Questions ({question_mode})...")
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            
            result = self._call_api_with_retry(req, timeout=120)
                
            candidates = result.get("candidates", [])
            if not candidates:
                raise AIProviderError("No response content generated from Gemini.")
                
            content_text = candidates[0]["content"]["parts"][0]["text"]
            return self._clean_and_parse_json(content_text)
            
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else ""
            logger.error(f"Gemini API returned status {e.code}. Details: {error_body}")
            raise AIProviderError(f"Gemini API HTTP Error {e.code}: {e.reason}")
        except Exception as e:
            logger.error(f"Error communicating with Gemini: {str(e)}")
            raise AIProviderError(f"Gemini integration error: {str(e)}")



class GroqAIProvider(BaseAIProvider):
    """Groq API integration."""
    
    def generate_summary(self, title: str, text: str) -> Dict[str, Any]:
        api_key = settings.GROQ_API_KEY
        if not api_key:
            raise AIProviderError("GROQ_API_KEY is not configured.")
            
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": get_user_prompt(title, text)}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            logger.info("Calling Groq (llama-3.3-70b-versatile)...")
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=120) as response:
                result = json.loads(response.read().decode("utf-8"))
                
            choices = result.get("choices", [])
            if not choices:
                raise AIProviderError("No response content generated from Groq.")
                
            content_text = choices[0]["message"]["content"]
            return self._clean_and_parse_json(content_text)
            
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else ""
            logger.error(f"Groq API returned status {e.code}. Details: {error_body}")
            raise AIProviderError(f"Groq API HTTP Error {e.code}: {e.reason}")
        except Exception as e:
            logger.error(f"Error communicating with Groq: {str(e)}")
            raise AIProviderError(f"Groq integration error: {str(e)}")

    def generate_concepts(self, title: str, text: str) -> Dict[str, Any]:
        api_key = settings.GROQ_API_KEY
        if not api_key:
            raise AIProviderError("GROQ_API_KEY is not configured.")
            
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": CONCEPT_SYSTEM_PROMPT},
                {"role": "user", "content": get_concept_user_prompt(title, text)}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            logger.info("Calling Groq (llama-3.3-70b-versatile) for concepts...")
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=120) as response:
                result = json.loads(response.read().decode("utf-8"))
                
            choices = result.get("choices", [])
            if not choices:
                raise AIProviderError("No response content generated from Groq.")
                
            content_text = choices[0]["message"]["content"]
            return self._clean_and_parse_json(content_text)
            
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else ""
            logger.error(f"Groq API returned status {e.code}. Details: {error_body}")
            raise AIProviderError(f"Groq API HTTP Error {e.code}: {e.reason}")
        except Exception as e:
            logger.error(f"Error communicating with Groq: {str(e)}")
            raise AIProviderError(f"Groq integration error: {str(e)}")

    def generate_revision(self, title: str, text: str, revision_time: str) -> Dict[str, Any]:
        api_key = settings.GROQ_API_KEY
        if not api_key:
            raise AIProviderError("GROQ_API_KEY is not configured.")
            
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": REVISION_SYSTEM_PROMPT.format(revision_time=revision_time)},
                {"role": "user", "content": get_revision_user_prompt(title, text)}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            logger.info(f"Calling Groq (llama-3.3-70b-versatile) for Revision Notes ({revision_time})...")
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=120) as response:
                result = json.loads(response.read().decode("utf-8"))
                
            choices = result.get("choices", [])
            if not choices:
                raise AIProviderError("No response content generated from Groq.")
                
            content_text = choices[0]["message"]["content"]
            return self._clean_and_parse_json(content_text)
            
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else ""
            logger.error(f"Groq API returned status {e.code}. Details: {error_body}")
            raise AIProviderError(f"Groq API HTTP Error {e.code}: {e.reason}")
        except Exception as e:
            logger.error(f"Error communicating with Groq: {str(e)}")
            raise AIProviderError(f"Groq integration error: {str(e)}")

    def generate_important_questions(self, title: str, text: str, question_mode: str) -> Dict[str, Any]:
        api_key = settings.GROQ_API_KEY
        if not api_key:
            raise AIProviderError("GROQ_API_KEY is not configured.")
            
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": IMPORTANT_QUESTIONS_SYSTEM_PROMPT},
                {"role": "user", "content": get_important_questions_user_prompt(title, text, question_mode)}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            logger.info(f"Calling Groq (llama-3.3-70b-versatile) for Important Questions ({question_mode})...")
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=120) as response:
                result = json.loads(response.read().decode("utf-8"))
                
            choices = result.get("choices", [])
            if not choices:
                raise AIProviderError("No response content generated from Groq.")
                
            content_text = choices[0]["message"]["content"]
            return self._clean_and_parse_json(content_text)
            
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else ""
            logger.error(f"Groq API returned status {e.code}. Details: {error_body}")
            raise AIProviderError(f"Groq API HTTP Error {e.code}: {e.reason}")
        except Exception as e:
            logger.error(f"Error communicating with Groq: {str(e)}")
            raise AIProviderError(f"Groq integration error: {str(e)}")



class OpenRouterAIProvider(BaseAIProvider):
    """OpenRouter API integration."""
    
    def generate_summary(self, title: str, text: str) -> Dict[str, Any]:
        api_key = settings.OPENROUTER_API_KEY
        if not api_key:
            raise AIProviderError("OPENROUTER_API_KEY is not configured.")
            
        url = "https://openrouter.ai/api/v1/chat/completions"
        
        payload = {
            "model": "google/gemini-2.5-flash",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": get_user_prompt(title, text)}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
            "max_tokens": 4096
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "AI Learning Accelerator"
        }
        
        try:
            logger.info("Calling OpenRouter (google/gemini-2.5-flash)...")
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=120) as response:
                result = json.loads(response.read().decode("utf-8"))
                
            choices = result.get("choices", [])
            if not choices:
                raise AIProviderError("No response content generated from OpenRouter.")
                
            content_text = choices[0]["message"]["content"]
            return self._clean_and_parse_json(content_text)
            
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else ""
            logger.error(f"OpenRouter API returned status {e.code}. Details: {error_body}")
            raise AIProviderError(f"OpenRouter API HTTP Error {e.code}: {e.reason}")
        except Exception as e:
            logger.error(f"Error communicating with OpenRouter: {str(e)}")
            raise AIProviderError(f"OpenRouter integration error: {str(e)}")

    def generate_concepts(self, title: str, text: str) -> Dict[str, Any]:
        api_key = settings.OPENROUTER_API_KEY
        if not api_key:
            raise AIProviderError("OPENROUTER_API_KEY is not configured.")
            
        url = "https://openrouter.ai/api/v1/chat/completions"
        
        payload = {
            "model": "google/gemini-2.5-flash",
            "messages": [
                {"role": "system", "content": CONCEPT_SYSTEM_PROMPT},
                {"role": "user", "content": get_concept_user_prompt(title, text)}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
            "max_tokens": 4096
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "AI Learning Accelerator"
        }
        
        try:
            logger.info("Calling OpenRouter (google/gemini-2.5-flash) for concepts...")
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=120) as response:
                result = json.loads(response.read().decode("utf-8"))
                
            choices = result.get("choices", [])
            if not choices:
                raise AIProviderError("No response content generated from OpenRouter.")
                
            content_text = choices[0]["message"]["content"]
            return self._clean_and_parse_json(content_text)
            
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else ""
            logger.error(f"OpenRouter API returned status {e.code}. Details: {error_body}")
            raise AIProviderError(f"OpenRouter API HTTP Error {e.code}: {e.reason}")
        except Exception as e:
            logger.error(f"Error communicating with OpenRouter: {str(e)}")
            raise AIProviderError(f"OpenRouter integration error: {str(e)}")

    def generate_revision(self, title: str, text: str, revision_time: str) -> Dict[str, Any]:
        api_key = settings.OPENROUTER_API_KEY
        if not api_key:
            raise AIProviderError("OPENROUTER_API_KEY is not configured.")
            
        url = "https://openrouter.ai/api/v1/chat/completions"
        
        payload = {
            "model": "google/gemini-2.5-flash",
            "messages": [
                {"role": "system", "content": REVISION_SYSTEM_PROMPT.format(revision_time=revision_time)},
                {"role": "user", "content": get_revision_user_prompt(title, text)}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
            "max_tokens": 4096
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "AI Learning Accelerator"
        }
        
        try:
            logger.info(f"Calling OpenRouter (google/gemini-2.5-flash) for Revision Notes ({revision_time})...")
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=120) as response:
                result = json.loads(response.read().decode("utf-8"))
                
            choices = result.get("choices", [])
            if not choices:
                raise AIProviderError("No response content generated from OpenRouter.")
                
            content_text = choices[0]["message"]["content"]
            return self._clean_and_parse_json(content_text)
            
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else ""
            logger.error(f"OpenRouter API returned status {e.code}. Details: {error_body}")
            raise AIProviderError(f"OpenRouter API HTTP Error {e.code}: {e.reason}")
        except Exception as e:
            logger.error(f"Error communicating with OpenRouter: {str(e)}")
            raise AIProviderError(f"OpenRouter integration error: {str(e)}")

    def generate_important_questions(self, title: str, text: str, question_mode: str) -> Dict[str, Any]:
        api_key = settings.OPENROUTER_API_KEY
        if not api_key:
            raise AIProviderError("OPENROUTER_API_KEY is not configured.")
            
        url = "https://openrouter.ai/api/v1/chat/completions"
        
        payload = {
            "model": "google/gemini-2.5-flash",
            "messages": [
                {"role": "system", "content": IMPORTANT_QUESTIONS_SYSTEM_PROMPT},
                {"role": "user", "content": get_important_questions_user_prompt(title, text, question_mode)}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
            "max_tokens": 4096
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "AI Learning Accelerator"
        }
        
        try:
            logger.info(f"Calling OpenRouter (google/gemini-2.5-flash) for Important Questions ({question_mode})...")
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=120) as response:
                result = json.loads(response.read().decode("utf-8"))
                
            choices = result.get("choices", [])
            if not choices:
                raise AIProviderError("No response content generated from OpenRouter.")
                
            content_text = choices[0]["message"]["content"]
            return self._clean_and_parse_json(content_text)
            
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else ""
            logger.error(f"OpenRouter API returned status {e.code}. Details: {error_body}")
            raise AIProviderError(f"OpenRouter API HTTP Error {e.code}: {e.reason}")
        except Exception as e:
            logger.error(f"Error communicating with OpenRouter: {str(e)}")
            raise AIProviderError(f"OpenRouter integration error: {str(e)}")


class AIManager:
    """Manager class that exposes pluggable AI service functionality."""
    
    @staticmethod
    def get_provider(provider_name: Optional[str] = None) -> BaseAIProvider:
        """
        Returns the requested AI provider, or picks the first available based on key configuration.
        """
        if provider_name:
            name_lower = provider_name.lower()
            if name_lower == "google":
                return GoogleAIProvider()
            elif name_lower == "groq":
                return GroqAIProvider()
            elif name_lower == "openrouter":
                return OpenRouterAIProvider()
            else:
                logger.warning(f"Unknown provider '{provider_name}' requested. Falling back to default selection.")

        # Fallback priority logic based on key availability
        if settings.GEMINI_API_KEY:
            return GoogleAIProvider()
        elif settings.GROQ_API_KEY:
            return GroqAIProvider()
        elif settings.OPENROUTER_API_KEY:
            return OpenRouterAIProvider()
        else:
            raise AIProviderError("No AI Provider keys (GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY) found in settings.")

    @classmethod
    def generate_summary(cls, title: str, text: str, provider_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes summary generation with automatic fallback to another provider on failure.
        """
        # Truncate text if it is extremely large to avoid token limit errors
        # A maximum of 40,000 characters is plenty for a 10-minute high-yield learning experience.
        max_chars = 40000
        truncated_text = text
        if len(text) > max_chars:
            logger.warning(f"Document content size ({len(text)} chars) is large. Truncating to {max_chars} chars for processing.")
            truncated_text = text[:max_chars] + "\n\n[Content truncated for token safety...]"

        provider = cls.get_provider(provider_name)
        
        try:
            return provider.generate_summary(title, truncated_text)
        except Exception as e:
            logger.warning(f"Primary AI provider failed: {str(e)}. Attempting backup fallback provider...")
            
            # If the primary provider was Google and it failed, try Groq then OpenRouter
            current_name = type(provider).__name__
            fallback_providers = []
            
            if current_name != "GoogleAIProvider" and settings.GEMINI_API_KEY:
                fallback_providers.append(GoogleAIProvider())
            if current_name != "GroqAIProvider" and settings.GROQ_API_KEY:
                fallback_providers.append(GroqAIProvider())
            if current_name != "OpenRouterAIProvider" and settings.OPENROUTER_API_KEY:
                fallback_providers.append(OpenRouterAIProvider())
                
            for backup in fallback_providers:
                try:
                    logger.info(f"Retrying summary generation using backup: {type(backup).__name__}")
                    return backup.generate_summary(title, truncated_text)
                except Exception as backup_err:
                    logger.error(f"Backup provider {type(backup).__name__} failed: {str(backup_err)}")
                    
            # If everything failed, re-raise the original exception
            raise AIProviderError(f"All configured AI providers failed to generate summary: {str(e)}")

    @classmethod
    def generate_concepts(cls, title: str, text: str, provider_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes concept map extraction with automatic fallback to another provider on failure.
        """
        # Truncate text if it is extremely large to avoid token limit errors
        max_chars = 20000
        truncated_text = text
        if len(text) > max_chars:
            logger.warning(f"Document content size ({len(text)} chars) is large for concepts. Truncating to {max_chars} chars.")
            truncated_text = text[:max_chars] + "\n\n[Content truncated for token safety...]"

        provider = cls.get_provider(provider_name)
        
        try:
            return provider.generate_concepts(title, truncated_text)
        except Exception as e:
            logger.warning(f"Primary AI provider failed for concepts: {str(e)}. Attempting backup fallback provider...")
            
            current_name = type(provider).__name__
            fallback_providers = []
            
            if current_name != "GoogleAIProvider" and settings.GEMINI_API_KEY:
                fallback_providers.append(GoogleAIProvider())
            if current_name != "GroqAIProvider" and settings.GROQ_API_KEY:
                fallback_providers.append(GroqAIProvider())
            if current_name != "OpenRouterAIProvider" and settings.OPENROUTER_API_KEY:
                fallback_providers.append(OpenRouterAIProvider())
                
            for backup in fallback_providers:
                try:
                    logger.info(f"Retrying concepts extraction using backup: {type(backup).__name__}")
                    return backup.generate_concepts(title, truncated_text)
                except Exception as backup_err:
                    logger.error(f"Backup provider {type(backup).__name__} failed for concepts: {str(backup_err)}")
                    
            raise AIProviderError(f"All configured AI providers failed to extract concepts: {str(e)}")

    @classmethod
    def generate_revision(cls, title: str, text: str, revision_time: str, provider_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes revision notes generation with automatic fallback to another provider on failure.
        """
        # Truncate text if it is extremely large to avoid token limit errors
        max_chars = 40000
        truncated_text = text
        if len(text) > max_chars:
            logger.warning(f"Document content size ({len(text)} chars) is large. Truncating to {max_chars} chars.")
            truncated_text = text[:max_chars] + "\n\n[Content truncated for token safety...]"

        provider = cls.get_provider(provider_name)
        
        try:
            return provider.generate_revision(title, truncated_text, revision_time)
        except Exception as e:
            logger.warning(f"Primary AI provider failed for revision: {str(e)}. Attempting backup fallback provider...")
            
            current_name = type(provider).__name__
            fallback_providers = []
            
            if current_name != "GoogleAIProvider" and settings.GEMINI_API_KEY:
                fallback_providers.append(GoogleAIProvider())
            if current_name != "GroqAIProvider" and settings.GROQ_API_KEY:
                fallback_providers.append(GroqAIProvider())
            if current_name != "OpenRouterAIProvider" and settings.OPENROUTER_API_KEY:
                fallback_providers.append(OpenRouterAIProvider())
                
            for backup in fallback_providers:
                try:
                    logger.info(f"Retrying revision generation using backup: {type(backup).__name__}")
                    return backup.generate_revision(title, truncated_text, revision_time)
                except Exception as backup_err:
                    logger.error(f"Backup provider {type(backup).__name__} failed for revision: {str(backup_err)}")
                    
            raise AIProviderError(f"All configured AI providers failed to generate revision: {str(e)}")

    @classmethod
    def generate_important_questions(cls, title: str, text: str, question_mode: str, provider_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes important questions generation with automatic fallback to another provider on failure.
        """
        # Truncate text if it is extremely large to avoid token limit errors
        max_chars = 40000
        truncated_text = text
        if len(text) > max_chars:
            logger.warning(f"Document content size ({len(text)} chars) is large. Truncating to {max_chars} chars.")
            truncated_text = text[:max_chars] + "\n\n[Content truncated for token safety...]"

        provider = cls.get_provider(provider_name)
        
        try:
            return provider.generate_important_questions(title, truncated_text, question_mode)
        except Exception as e:
            logger.warning(f"Primary AI provider failed for important questions: {str(e)}. Attempting backup fallback provider...")
            
            current_name = type(provider).__name__
            fallback_providers = []
            
            if current_name != "GoogleAIProvider" and settings.GEMINI_API_KEY:
                fallback_providers.append(GoogleAIProvider())
            if current_name != "GroqAIProvider" and settings.GROQ_API_KEY:
                fallback_providers.append(GroqAIProvider())
            if current_name != "OpenRouterAIProvider" and settings.OPENROUTER_API_KEY:
                fallback_providers.append(OpenRouterAIProvider())
                
            for backup in fallback_providers:
                try:
                    logger.info(f"Retrying important questions generation using backup: {type(backup).__name__}")
                    return backup.generate_important_questions(title, truncated_text, question_mode)
                except Exception as backup_err:
                    logger.error(f"Backup provider {type(backup).__name__} failed for important questions: {str(backup_err)}")
                    
            raise AIProviderError(f"All configured AI providers failed to generate important questions: {str(e)}")

