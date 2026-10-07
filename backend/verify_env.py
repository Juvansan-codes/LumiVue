import sys
import platform

print("Verification Report")
print("===================")

# Python version
print(f"Python: {sys.version.split()[0]} ({platform.architecture()[0]})")

try:
    import torch
    print(f"PyTorch: {torch.__version__}")
    
    cuda_available = torch.cuda.is_available()
    
    if hasattr(torch.version, 'cuda'):
        print(f"PyTorch CUDA build: {torch.version.cuda}")
    else:
        print("PyTorch CUDA build: None")
        
    print(f"CUDA available: {cuda_available}")
    
    if cuda_available:
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        total_memory = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        print(f"GPU memory: {total_memory:.2f} GB")
    else:
        print("GPU: None")
        print("GPU memory: None")
except ImportError:
    print("PyTorch: Not installed")
    print("CUDA available: Unknown")
    print("PyTorch CUDA build: Unknown")
    print("GPU: Unknown")
    print("GPU memory: Unknown")

try:
    import torchvision
    print(f"Torchvision: {torchvision.__version__}")
except ImportError:
    print("Torchvision: Not installed")
