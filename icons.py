import cv2
import numpy as np
import os
from PIL import Image
from pathlib import Path

def extract_icons(screenshot_path, output_dir="extracted_icons"):
    """
    Extract icons from screenshot with transparent backgrounds using improved detection
    Returns: List of paths to extracted icons
    """
    # Create output directory
    Path(output_dir).mkdir(exist_ok=True)
    
    # Load image and convert to RGBA
    img = cv2.imread(screenshot_path)
    if img is None:
        print("Error: Could not read image file %s" % screenshot_path)
        return []
        
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_rgba = cv2.cvtColor(img, cv2.COLOR_BGR2RGBA)
    
    # Use multiple processing methods for better icon detection
    masks = []
    
    # Method 1: Edge detection based
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    kernel = np.ones((3,3), np.uint8)
    dilated_edges = cv2.dilate(edges, kernel, iterations=2)
    masks.append(dilated_edges)
    
    # Method 2: Adaptive thresholding for better handling of various backgrounds
    adaptive_thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY_INV, 11, 2
    )
    cleaned_adaptive = cv2.morphologyEx(adaptive_thresh, cv2.MORPH_OPEN, kernel, iterations=1)
    cleaned_adaptive = cv2.morphologyEx(cleaned_adaptive, cv2.MORPH_CLOSE, kernel, iterations=2)
    masks.append(cleaned_adaptive)
    
    # Method 3: Color-based segmentation (for colored icons)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    saturation = hsv[:,:,1]
    _, sat_mask = cv2.threshold(saturation, 30, 255, cv2.THRESH_BINARY)
    cleaned_sat = cv2.morphologyEx(sat_mask, cv2.MORPH_OPEN, kernel, iterations=1)
    masks.append(cleaned_sat)
    
    # Method 4: Traditional threshold with optimized value
    _, binary_mask = cv2.threshold(gray, 225, 255, cv2.THRESH_BINARY_INV)
    cleaned_binary = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel, iterations=1)
    masks.append(cleaned_binary)
    
    # Combine masks
    combined_mask = np.zeros_like(gray)
    for mask in masks:
        combined_mask = cv2.bitwise_or(combined_mask, mask)
    
    # Final cleanup
    cleaned_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    
    # Find contours on the combined mask
    contours, _ = cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Process and save icons
    icon_paths = []
    min_area = 100  # Reduced minimum area to catch smaller icons
    max_area = 50000
    max_aspect_ratio = 5.0  # Filter out extremely elongated shapes
    
    for i, cnt in enumerate(contours):
        # Filter by size and shape
        area = cv2.contourArea(cnt)
        if not (min_area < area < max_area):
            continue
            
        # Calculate aspect ratio
        x, y, w, h = cv2.boundingRect(cnt)
        aspect_ratio = max(w/h if h > 0 else 999, h/w if w > 0 else 999)
        
        # Filter out highly elongated shapes (likely not icons)
        if aspect_ratio > max_aspect_ratio:
            continue
            
        # Use convex hull for better edge detection
        hull = cv2.convexHull(cnt)
        
        # Get bounding box with adaptive padding (smaller for small icons)
        padding = max(3, min(int(area**0.25), 10))  # Adaptive padding
        x, y, w, h = cv2.boundingRect(hull)
        x, y, w, h = (
            max(0, x - padding),
            max(0, y - padding),
            w + 2*padding,
            h + 2*padding
        )
        
        # Ensure coordinates don't go out of bounds
        x = min(x, img_rgba.shape[1] - 1)
        y = min(y, img_rgba.shape[0] - 1)
        w = min(w, img_rgba.shape[1] - x)
        h = min(h, img_rgba.shape[0] - y)
        
        # Skip if resulting region is too small
        if w < 5 or h < 5:
            continue
        
        # Create icon with transparency
        icon = img_rgba[y:y+h, x:x+w].copy()
        
        # Create alpha channel with the exact same dimensions as the icon
        alpha_channel = np.zeros((h, w), dtype=np.uint8)
        
        # Adjust contour coordinates to be within the alpha channel's bounds
        adjusted_cnt = hull - np.array([[x, y]])
        
        # Draw contour only if it's within bounds
        cv2.drawContours(alpha_channel, [adjusted_cnt], -1, 255, -1)
        
        # Refine alpha edges with a slight blur for smoother edges
        alpha_channel = cv2.GaussianBlur(alpha_channel, (3, 3), 0)
        
        # Apply alpha channel
        icon[:, :, 3] = alpha_channel
        
        # Save icon with minimal compression for better quality
        icon_img = Image.fromarray(icon)
        output_path = f"{output_dir}/icon_{i}.png"
        icon_img.save(output_path, optimize=True, quality=95)
        icon_paths.append(output_path)
        
    # Optional: Remove tiny or duplicated icons
    filtered_paths = remove_duplicate_icons(icon_paths)
    
    return filtered_paths

def remove_duplicate_icons(icon_paths, similarity_threshold=0.85):
    """Remove duplicate or very similar icons"""
    if not icon_paths:
        return []
        
    # Load all icons
    icons = []
    for path in icon_paths:
        try:
            img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
            if img is not None:
                # Resize to normalize for comparison
                img_small = cv2.resize(img, (64, 64), interpolation=cv2.INTER_AREA)
                icons.append((path, img_small))
        except Exception as e:
            print(f"Error loading {path}: {e}")
    
    # Find duplicates
    to_remove = set()
    for i in range(len(icons)):
        if icons[i][0] in to_remove:
            continue
            
        for j in range(i+1, len(icons)):
            if icons[j][0] in to_remove:
                continue
                
            # Compare images
            img1 = icons[i][1]
            img2 = icons[j][1]
            
            # Simple histogram comparison
            try:
                hist1 = cv2.calcHist([img1], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
                hist2 = cv2.calcHist([img2], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
                
                cv2.normalize(hist1, hist1, 0, 1.0, cv2.NORM_MINMAX)
                cv2.normalize(hist2, hist2, 0, 1.0, cv2.NORM_MINMAX)
                
                similarity = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
                
                # If very similar, mark the smaller one for removal
                if similarity > similarity_threshold:
                    size1 = os.path.getsize(icons[i][0])
                    size2 = os.path.getsize(icons[j][0])
                    to_remove.add(icons[i][0] if size1 < size2 else icons[j][0])
            except Exception:
                continue
    
    # Filter out duplicates
    filtered_paths = [path for path in icon_paths if path not in to_remove]
    
    # Remove the duplicate files
    for path in to_remove:
        try:
            os.remove(path)
        except:
            pass
            
    return filtered_paths

# Usage example:
if __name__ == "__main__":
    # Replace with your actual screenshot path
    screenshot_path = "frame_0068.png"
    
    # Extract icons
    extracted_icons = extract_icons(screenshot_path)
    
    print(f"Extracted {len(extracted_icons)} icons:")
    for path in extracted_icons:
        print(f"- {path}")