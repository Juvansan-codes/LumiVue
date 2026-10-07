import os
import sys
from pathlib import Path

import numpy as np
import pydicom
from pydicom.dataset import FileDataset, FileMetaDataset
from pydicom.uid import UID

# Add backend dir to sys.path so we can import from training.dataset
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from training.dataset import RSNAPneumoniaDataset

def create_mock_dicom(filepath: Path, patient_id: str):
    """Creates a very basic mock DICOM file with a 1024x1024 pixel array."""
    file_meta = FileMetaDataset()
    file_meta.MediaStorageSOPClassUID = UID('1.2.840.10008.5.1.4.1.1.7')
    file_meta.MediaStorageSOPInstanceUID = UID('1.2.3')
    file_meta.ImplementationClassUID = UID('1.2.3.4')
    file_meta.TransferSyntaxUID = pydicom.uid.ImplicitVRLittleEndian

    ds = FileDataset(filepath, {}, file_meta=file_meta, preamble=b"\0" * 128)
    
    ds.PatientID = patient_id
    ds.Rows = 1024
    ds.Columns = 1024
    ds.BitsAllocated = 16
    ds.BitsStored = 16
    ds.HighBit = 15
    ds.PixelRepresentation = 0
    ds.SamplesPerPixel = 1
    ds.PhotometricInterpretation = "MONOCHROME2"
    
    # Generate a random pixel array
    pixel_array = np.random.randint(0, 255, (1024, 1024), dtype=np.uint16)
    ds.PixelData = pixel_array.tobytes()
    
    ds.is_little_endian = True
    ds.is_implicit_VR = True
    
    ds.save_as(filepath)

def setup_mock_data(data_dir: Path):
    """Creates mock CSV and DICOM files for testing."""
    data_dir.mkdir(parents=True, exist_ok=True)
    images_dir = data_dir / "stage_2_train_images"
    images_dir.mkdir(exist_ok=True)
    
    csv_file = data_dir / "stage_2_train_labels.csv"
    
    # Write mock CSV with 3 patients. Patient A has no pneumonia. Patient B has 2 bboxes. Patient C has 1 bbox.
    csv_content = (
        "patientId,x,y,width,height,Target\n"
        "patient_A,,,,,0\n"
        "patient_B,100.0,200.0,50.0,60.0,1\n"
        "patient_B,300.0,400.0,100.0,100.0,1\n"
        "patient_C,512.0,512.0,256.0,256.0,1\n"
    )
    csv_file.write_text(csv_content)
    
    for pid in ["patient_A", "patient_B", "patient_C"]:
        create_mock_dicom(images_dir / f"{pid}.dcm", pid)
        
    print(f"Mock data created at {data_dir}")

def run_tests():
    data_dir = Path("data/raw")
    setup_mock_data(data_dir)
    
    print("\n--- Testing RSNAPneumoniaDataset (Train Split) ---")
    dataset = RSNAPneumoniaDataset(data_dir=data_dir, split="train", seed=42)
    
    print(f"Dataset length: {len(dataset)} samples")
    
    for i in range(len(dataset)):
        sample = dataset[i]
        print(f"\nSample {i}: Patient ID: {sample['patient_id']}")
        print(f"Image tensor shape: {sample['image'].shape}")
        print(f"Target label: {sample['label']}")
        print(f"BBoxes shape: {sample['bboxes'].shape}")
        if len(sample['bboxes']) > 0:
            print(f"BBoxes values (scaled to 224x224):\n{sample['bboxes']}")
        print(f"Original shape: {sample['original_shape']}")

if __name__ == "__main__":
    run_tests()
