import json
import os

# Folder containing your JSON files
data_folder = 'data'

# Output SQL file
output_file = 'import_products.sql'

sql_lines = []
sql_lines.append("INSERT INTO products (name, slug, price, old_price, description, short_description, thumbnail, images, category_slug, featured, in_stock, stock_quantity, sku, rating, reviews, tags) VALUES")

product_count = 0
first_product = True

# Loop through all JSON files in data folder
for filename in os.listdir(data_folder):
    if filename.endswith('.json') and filename != 'categories.json':
        filepath = os.path.join(data_folder, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                # Check if this file has a products array
                if isinstance(data, list):
                    products = data
                elif isinstance(data, dict) and 'products' in data:
                    products = data['products']
                else:
                    continue
                
                # Get category slug from filename
                category_slug = filename.replace('.json', '')
                
                for product in products:
                    # Skip if product has no name or price
                    if not product.get('name') or not product.get('price'):
                        continue
                    
                    # Escape single quotes in text fields
                    name = product.get('name', '').replace("'", "''")
                    slug = product.get('slug', '').replace("'", "''")
                    description = product.get('description', '').replace("'", "''") if product.get('description') else 'NULL'
                    short_description = product.get('shortDescription', '').replace("'", "''") if product.get('shortDescription') else 'NULL'
                    sku = product.get('sku', '').replace("'", "''") if product.get('sku') else 'NULL'
                    thumbnail = product.get('thumbnail', '').replace("'", "''") if product.get('thumbnail') else 'NULL'
                    
                    # Handle arrays
                    images = product.get('images', [])
                    images_str = 'ARRAY[' + ','.join(["'{}'".format(img.replace("'", "''")) for img in images]) + ']' if images else 'NULL'
                    
                    tags = product.get('tags', [])
                    tags_str = 'ARRAY[' + ','.join(["'{}'".format(tag.replace("'", "''")) for tag in tags]) + ']' if tags else 'NULL'
                    
                    # Boolean values
                    featured = 'true' if product.get('featured') else 'false'
                    in_stock = 'true' if product.get('inStock', True) else 'false'
                    
                    # Numbers
                    price = product.get('price', 0)
                    old_price = product.get('oldPrice', 'NULL') if product.get('oldPrice') else 'NULL'
                    stock_quantity = product.get('stockQuantity', 0)
                    rating = product.get('rating', 0)
                    reviews = product.get('reviews', 0)
                    
                    if not first_product:
                        sql_lines.append(',')
                    
                    sql_lines.append(f"""(
    '{name}',
    '{slug}',
    {price},
    {old_price},
    '{description}',
    '{short_description}',
    '{thumbnail}',
    {images_str},
    '{category_slug}',
    {featured},
    {in_stock},
    {stock_quantity},
    '{sku}',
    {rating},
    {reviews},
    {tags_str}
)""")
                    
                    first_product = False
                    product_count += 1
                    
        except Exception as e:
            print(f"Error reading {filename}: {e}")

sql_lines.append(';')
sql_lines.append(f'-- Total products imported: {product_count}')

# Write to file
with open(output_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f"✅ SQL generated! {product_count} products ready to import.")
print(f"📁 File saved as: {output_file}")