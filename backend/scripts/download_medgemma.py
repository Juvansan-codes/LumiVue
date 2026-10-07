import os
import time
from huggingface_hub import snapshot_download

def download_medgemma():
    print("Starting MedGemma 1.5 4B model download with Auto-Resume...")
    repo_id = "google/medgemma-1.5-4b-it"
    
    max_retries = 20
    attempt = 0
    
    while attempt < max_retries:
        try:
            print(f"\n--- Download Attempt {attempt + 1}/{max_retries} ---")
            path = snapshot_download(
                repo_id=repo_id,
                max_workers=4,
                token=os.environ.get("HF_TOKEN")
            )
            print(f"\n[SUCCESS] MedGemma has been fully downloaded to: {path}")
            return
        except Exception as e:
            attempt += 1
            print(f"\n[NETWORK DROP] Connection interrupted: {e}")
            if attempt < max_retries:
                print("Automatically reconnecting in 5 seconds to resume from where it left off...")
                time.sleep(5)
            else:
                print("\n[FAILED] Max retries reached. Please check your internet connection stability.")

if __name__ == "__main__":
    download_medgemma()
