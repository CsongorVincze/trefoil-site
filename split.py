import os
import re
import sys

def slugify(v):
    v = v.lower()
    v = v.replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ö', 'o').replace('ő', 'o').replace('ú', 'u').replace('ü', 'u').replace('ű', 'u')
    v = re.sub(r'[^a-z0-9]+', '-', v)
    v = v.strip('-')
    return v

def process_file(mdx_path):
    print(f"Processing {mdx_path}...")
    base_name = os.path.basename(mdx_path).replace('.mdx', '').replace('.md', '')
    out_dir = os.path.join(os.path.dirname(mdx_path), slugify(base_name))

    if not os.path.exists(out_dir):
        os.makedirs(out_dir)

    with open(mdx_path, 'r', encoding='utf-8') as f:
        text = f.read()

    parts = text.split('---', 2)
    if len(parts) < 3:
        print("Error splitting frontmatter")
        return

    frontmatter_raw = parts[1].strip()
    body = parts[2].strip()

    # Capture imports
    import_lines = []
    body_lines = body.split('\n')
    other_body_lines = []
    for line in body_lines:
        if line.startswith('import '):
            import_lines.append(line)
        else:
            other_body_lines.append(line)

    imports_text = '\n'.join(import_lines)
    imports_text = imports_text.replace("'../../", "'../../../").replace('"../../', '"../../../')

    body_no_imports = '\n'.join(other_body_lines)

    chunks = re.split(r'\n(## .*)\n', '\n' + body_no_imports)
    intro_content = chunks[0]
    topics = []

    for i in range(1, len(chunks), 2):
        title_line = chunks[i]
        content = chunks[i+1]
        title = title_line.replace('## ', '').strip()
        topics.append({
            'title': title,
            'content': title_line + '\n' + content,
        })
        
    if not topics:
        print(f"No chapters found in {mdx_path}")
        return

    if intro_content.strip():
        topics[0]['content'] = intro_content + '\n' + topics[0]['content']

    # parse existing frontmatter properties to keep them
    heroParam = ""
    hero_match = re.search(r"heroImage:\s*'([^']+)'", frontmatter_raw)
    if hero_match:
        heroParam = f"heroImage: '{hero_match.group(1).replace('../../', '../../../')}'"

    tagsParam = "tags: []"
    tags_match = re.search(r"tags:\s*(\[.*?\])", frontmatter_raw)
    if tags_match:
        tagsParam = f"tags: {tags_match.group(1)}"

    # extract original category
    cat_match = re.search(r"category:\s*'([^']+)'", frontmatter_raw)
    categoryParam = f"category: '{cat_match.group(1)}'" if cat_match else "category: 'learn'"
    
    lang_match = re.search(r"lang:\s*'([^']+)'", frontmatter_raw)
    langParam = f"lang: '{lang_match.group(1)}'" if lang_match else "lang: 'en'"
    
    seriesId = slugify(base_name)

    files_generated = []
    for i, topic in enumerate(topics):
        slug_title = slugify(topic['title'])
        file_name = f"{i+1:02d}-{slug_title}.mdx"
        file_path = os.path.join(out_dir, file_name)
        
        prev_obj = ""
        next_obj = ""
        
        if i > 0:
            prev_title = topics[i-1]['title'].replace("'", "\\'")
            prev_slug = f"/blog/{seriesId}/{i:02d}-{slugify(topics[i-1]['title'])}"
            prev_obj = f"prev: {{ title: '{prev_title}', link: '{prev_slug}' }}\n"
            
        if i < len(topics) - 1:
            next_title = topics[i+1]['title'].replace("'", "\\'")
            next_slug = f"/blog/{seriesId}/{i+2:02d}-{slugify(topics[i+1]['title'])}"
            next_obj = f"next: {{ title: '{next_title}', link: '{next_slug}' }}\n"
            
        # Add series ID manually
        topic_frontmatter = f"""---
title: '{topic['title'].replace("'", "''")}'
description: 'Part of {base_name}.'
pubDate: 'Jan 02, 2026'
{heroParam}
{tagsParam}
{categoryParam}
{langParam}
seriesId: '{seriesId}'
order: {i+1}
{prev_obj}{next_obj}---"""

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(topic_frontmatter + '\n\n')
            if imports_text:
                f.write(imports_text + '\n\n')
            f.write(topic['content'])
            
        files_generated.append(file_path)

    print(f"Generated {len(files_generated)} files in {out_dir}")
    os.remove(mdx_path)

for mdx in ['src/content/blog/Electro.mdx', 'src/content/blog/Multi_var_anal.mdx', 'src/content/blog/Oscillations.mdx']:
    process_file(mdx)
