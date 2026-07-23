#!/usr/bin/env python3
"""
Converts PNG/JPG images in assets/images to WebP (keeps originals),
then updates references in HTML/CSS/JS files to point to the .webp files.

Run from the project root.
"""
from PIL import Image
from bs4 import BeautifulSoup
import os
import sys
import glob

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__) + os.sep + '..')
IMAGES_DIR = os.path.join(PROJECT_ROOT, 'assets', 'images')

# Extensions to convert
IMG_EXTS = ['.png', '.jpg', '.jpeg']

# Files to search for references
TEXT_EXTS = ['.html', '.css', '.js']


def find_images(dirpath):
    images = []
    for ext in IMG_EXTS:
        images.extend(glob.glob(os.path.join(dirpath, f'*{ext}')))
        images.extend(glob.glob(os.path.join(dirpath, f'*{ext.upper()}')))
    images = sorted(images)
    return images


def convert_image_to_webp(src_path, quality=90):
    base, _ = os.path.splitext(src_path)
    webp_path = base + '.webp'
    if os.path.exists(webp_path):
        print(f"Skipping (exists): {os.path.relpath(webp_path, PROJECT_ROOT)}")
        return webp_path
    try:
        im = Image.open(src_path)
        # Convert to RGB for formats that don't support alpha in lossy WebP
        if im.mode in ("RGBA", "LA"):
            # preserve alpha by using lossless WebP when alpha is present
            im.save(webp_path, 'WEBP', lossless=True)
        else:
            im = im.convert('RGB')
            im.save(webp_path, 'WEBP', quality=quality, method=6)
        print(f"Created: {os.path.relpath(webp_path, PROJECT_ROOT)}")
        return webp_path
    except Exception as e:
        print(f"Error converting {src_path}: {e}")
        return None


def update_references(root, original_path, webp_rel_path):
    """Replace occurrences of original filename with webp filename in text files."""
    orig_fname = os.path.basename(original_path)
    webp_fname = os.path.basename(webp_rel_path)
    files_touched = 0
    for ext in TEXT_EXTS:
        for path in glob.glob(os.path.join(root, f'**/*{ext}'), recursive=True):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    txt = f.read()
            except Exception:
                continue
            if orig_fname in txt:
                new_txt = txt.replace(orig_fname, webp_fname)
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_txt)
                files_touched += 1
                print(f"Updated {os.path.relpath(path, PROJECT_ROOT)}: {orig_fname} → {webp_fname}")
    return files_touched


def main():
    if not os.path.isdir(IMAGES_DIR):
        print('Images directory not found:', IMAGES_DIR)
        sys.exit(1)

    images = find_images(IMAGES_DIR)
    if not images:
        print('No images found to convert.')
        return

    summary = []
    for img in images:
        webp = convert_image_to_webp(img, quality=90)
        if webp:
            # create relative webp path as used in HTML (relative to project root)
            webp_rel = os.path.relpath(webp, PROJECT_ROOT).replace('\\', '/')
            orig_rel = os.path.relpath(img, PROJECT_ROOT).replace('\\', '/')
            touched = update_references(PROJECT_ROOT, orig_rel, webp_rel)
            summary.append((orig_rel, webp_rel, touched))

    print('\nConversion summary:')
    for orig, webp, touched in summary:
        print(f"- {orig} → {webp} (updated in {touched} files)")

    print('\nDone. Originals left in place as requested.')


if __name__ == '__main__':
    main()
