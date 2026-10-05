import os
import argparse
import torch

def train_model(data_yaml: str, epochs: int, batch_size: int, imgsz: int):
    from ultralytics import YOLO

    print("=" * 60)
    print("  FINE-TUNING YOLO MODEL FOR VIT UNDERPASS")
    print("=" * 60)
    print(f"[GPU Check] PyTorch CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"[GPU Check] Device: {torch.cuda.get_device_name(0)}")

    if not os.path.exists(data_yaml):
        print(f"[Error] Dataset configuration not found at: '{data_yaml}'")
        return

    model = YOLO("yolo11n.pt")

    print(f"[Training] Epochs: {epochs} | Batch Size: {batch_size} | Image Size: {imgsz}")
    
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        batch=batch_size,
        imgsz=imgsz,
        workers=2,
        device=0 if torch.cuda.is_available() else "cpu",
        project="runs/detect",
        name="vit_underpass_yolo",
        exist_ok=True,
        save=True,
        plots=True
    )

    print("[Success] Model fine-tuning completed!")
    print(f"[Weights Saved] Best model saved at: 'runs/detect/vit_underpass_yolo/weights/best.pt'")

def main():
    parser = argparse.ArgumentParser(description="Train YOLO Model for VIT Underpass")
    parser.add_argument("--data", type=str, default="configs/data.yaml", help="Path to data.yaml")
    parser.add_argument("--epochs", type=int, default=30, help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=4, help="Batch size (4-8 for 4GB VRAM)")
    parser.add_argument("--imgsz", type=int, default=640, help="Input image size")
    args = parser.parse_args()

    train_model(args.data, args.epochs, args.batch, args.imgsz)

if __name__ == "__main__":
    main()
