import os
import pydicom
import numpy as np
from PIL import Image
from pathlib import Path
from tqdm import tqdm
from concurrent.futures import ProcessPoolExecutor, as_completed

def convert_dicom_to_png(dicom_path, out_path):
    try:
        dicom_ds = pydicom.dcmread(dicom_path)
        pixel_array = dicom_ds.pixel_array.astype(np.float32)
        v_max = pixel_array.max()
        if v_max > 0:
            pixel_array = pixel_array / v_max
        image_3c = np.stack((pixel_array,) * 3, axis=-1)
        image_pil = Image.fromarray((image_3c * 255).astype(np.uint8))
        image_pil = image_pil.resize((224, 224))
        image_pil.save(out_path)
        return True
    except Exception as e:
        print(f"Error processing {dicom_path}: {e}")
        return False

def main():
    raw_dir = Path("data/raw/stage_2_train_images")
    out_dir = Path("data/processed_pngs/stage_2_train_images")
    
    if not raw_dir.exists():
        print(f"Directory not found: {raw_dir.absolute()}")
        return
        
    out_dir.mkdir(parents=True, exist_ok=True)
    
    dicom_files = list(raw_dir.glob("*.dcm"))
    print(f"Found {len(dicom_files)} DICOM files. Converting to PNG...")
    
    # Copy labels file to processed dir for easier loading
    labels_file = Path("data/raw/stage_2_train_labels.csv")
    if labels_file.exists():
        import shutil
        out_labels = Path("data/processed_pngs/stage_2_train_labels.csv")
        shutil.copy(labels_file, out_labels)
    
    with ProcessPoolExecutor(max_workers=os.cpu_count() or 4) as executor:
        futures = []
        for dcm_path in dicom_files:
            png_path = out_dir / (dcm_path.stem + ".png")
            if not png_path.exists():
                futures.append(executor.submit(convert_dicom_to_png, dcm_path, png_path))
                
        for future in tqdm(as_completed(futures), total=len(futures)):
            future.result()
            
    print("Caching complete!")

if __name__ == "__main__":
    main()
