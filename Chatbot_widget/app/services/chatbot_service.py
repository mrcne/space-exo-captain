import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, SystemMessage
from app.config import get_settings
from app.prompts.system_prompts import prompt_manager


class ChatbotService:
    def __init__(self):
        self.settings = get_settings()
        genai.configure(api_key=self.settings.google_api_key)
        
        self.llm = ChatGoogleGenerativeAI(
            model=self.settings.model_name,
            google_api_key=self.settings.google_api_key,
            temperature=0.2,
            convert_system_message_to_human=True
        )
        
        # Load system prompt from file
        try:
            self.system_prompt = prompt_manager.load_prompt(self.settings.active_prompt)
        except FileNotFoundError:
            # Fallback to default prompt if file not found
            self.system_prompt = prompt_manager.load_prompt("exoplanet_expert")
    
    async def get_response(self, user_message: str) -> str:
        try:
            messages = [
                SystemMessage(content=self.system_prompt),
                HumanMessage(content=user_message)
            ]
            
            response = await self.llm.ainvoke(messages)
            return response.content
        
        except Exception as e:
            raise Exception(f"Error generating response: {str(e)}")
    
    def reload_prompt(self):
        """Reload the system prompt (useful for development)."""
        try:
            self.system_prompt = prompt_manager.reload_prompt(self.settings.active_prompt)
        except FileNotFoundError:
            self.system_prompt = prompt_manager.load_prompt("exoplanet_expert")


chatbot_service = ChatbotService()