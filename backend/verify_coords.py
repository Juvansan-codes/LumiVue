import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.vision.gradcam import convert_coordinates

def run_tests():
    # TEST 1: Width = 2048, Height = 1536
    # In OpenCV/NumPy/PyTorch, shape is (Height, Width)
    original_shape_1 = (1536, 2048)
    
    # Mock a bbox that exceeds the boundaries in model space
    model_bbox = [0, 0, 300, 300] 
    
    converted_1 = convert_coordinates(model_bbox, original_shape=original_shape_1, model_shape=(224, 224))
    
    x, y, w, h = converted_1
    
    print("--- TEST 1: 2048x1536 ---")
    print(f"Original dimensions: width = {original_shape_1[1]}, height = {original_shape_1[0]}")
    print(f"Generated model-space box: {model_bbox}")
    print(f"Converted original-space box: {converted_1}")
    print(f"x + width: {x + w}")
    print(f"y + height: {y + h}")
    
    is_valid_x = (x + w) <= original_shape_1[1]
    is_valid_y = (y + h) <= original_shape_1[0]
    print(f"Valid: {is_valid_x and is_valid_y}")
    
    
    # TEST 2: Width = 512, Height = 512
    original_shape_2 = (512, 512)
    model_bbox_2 = [10, 10, 250, 250]
    converted_2 = convert_coordinates(model_bbox_2, original_shape=original_shape_2, model_shape=(224, 224))
    
    x2, y2, w2, h2 = converted_2
    
    print("\n--- TEST 2: 512x512 ---")
    print(f"Original dimensions: width = {original_shape_2[1]}, height = {original_shape_2[0]}")
    print(f"Generated model-space box: {model_bbox_2}")
    print(f"Converted original-space box: {converted_2}")
    print(f"x + width: {x2 + w2}")
    print(f"y + height: {y2 + h2}")
    
    is_valid_x2 = (x2 + w2) <= original_shape_2[1]
    is_valid_y2 = (y2 + h2) <= original_shape_2[0]
    print(f"Valid: {is_valid_x2 and is_valid_y2}")

if __name__ == "__main__":
    run_tests()
