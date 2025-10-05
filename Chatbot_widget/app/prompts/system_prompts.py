import os
from pathlib import Path
from typing import Optional


class PromptManager:
    """Manages system prompts for the chatbot."""
    
    def __init__(self):
        self.prompts_dir = Path(__file__).parent / "templates"
        self._prompts_cache = {}
    
    def load_prompt(self, prompt_name: str) -> str:
  
        if prompt_name in self._prompts_cache:
            return self._prompts_cache[prompt_name]
        
        prompt_path = self.prompts_dir / f"{prompt_name}.txt"
        
        if not prompt_path.exists():
            raise FileNotFoundError(f"Prompt file not found: {prompt_path}")
        
        with open(prompt_path, 'r', encoding='utf-8') as f:
            prompt_content = f.read().strip()
        
        self._prompts_cache[prompt_name] = prompt_content
        return prompt_content
    
    def get_available_prompts(self) -> list[str]:
        """Get list of available prompt names."""
        if not self.prompts_dir.exists():
            return []
        
        return [
            f.stem for f in self.prompts_dir.glob("*.txt")
        ]
    
    def reload_prompt(self, prompt_name: str) -> str:
        """Reload a prompt, bypassing the cache."""
        if prompt_name in self._prompts_cache:
            del self._prompts_cache[prompt_name]
        return self.load_prompt(prompt_name)


# Global instance
prompt_manager = PromptManager()