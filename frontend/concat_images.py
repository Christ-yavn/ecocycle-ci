import sys
from PIL import Image

def concat_images(img1_path, img2_path, output_path):
    img1 = Image.open(img1_path)
    img2 = Image.open(img2_path)
    
    # img1 is the header (on top), img2 is the row (on bottom)
    dst_width = max(img1.width, img2.width)
    dst_height = img1.height + img2.height
    
    dst = Image.new('RGB', (dst_width, dst_height), (255, 255, 255))
    
    # Align to left
    dst.paste(img1, (0, 0))
    dst.paste(img2, (0, img1.height))
    
    dst.save(output_path)
    print(f"Image saved to {output_path}")

if __name__ == '__main__':
    header_path = sys.argv[1]
    row_path = sys.argv[2]
    out_path = sys.argv[3]
    concat_images(header_path, row_path, out_path)
