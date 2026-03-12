import os
import re

dir_path = r'src\content\blog\vektorterek'
files = [f for f in os.listdir(dir_path) if f.endswith('.mdx')]
files.sort()

for i, filename in enumerate(files):
    filepath = os.path.join(dir_path, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    parts = content.split('---', 2)
    frontmatter = parts[1]
    
    # insert seriesId and order right before the first ---
    new_frontmatter = frontmatter.rstrip() + f"\nseriesId: 'vektorterek'\norder: {i+1}\n"
    new_content = f"---{new_frontmatter}---{parts[2]}"
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

print(f"Updated {len(files)} files with seriesId and order.")
