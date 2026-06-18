/* ============================================
   SUPABASE CLIENT - Magnificent Furnitures
   ============================================ */

// Supabase configuration - REPLACE WITH YOUR VALUES
const SUPABASE_URL = 'https://rxvtpesnqfskusuxogim.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kXyyA6W0Xz3pKEZfPPz0ZA_8cp6Bzgz';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// PRODUCT FUNCTIONS
// ============================================

// Fetch all products
async function fetchAllProducts() {
    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }
    return data;
}

// Fetch featured products
async function fetchFeaturedProducts() {
    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('featured', true)
        .limit(6);
    
    if (error) {
        console.error('Error fetching featured products:', error);
        return [];
    }
    return data;
}

// Fetch products by category
async function fetchProductsByCategory(categorySlug) {
    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('category_slug', categorySlug);
    
    if (error) {
        console.error('Error fetching products by category:', error);
        return [];
    }
    return data;
}

// Fetch a single product by slug
async function fetchProductBySlug(slug) {
    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();
    
    if (error) {
        console.error('Error fetching product:', error);
        return null;
    }
    return data;
}

// Add a product
async function addProduct(product) {
    const { data, error } = await supabaseClient
        .from('products')
        .insert([product])
        .select();
    
    if (error) {
        console.error('Error adding product:', error);
        return null;
    }
    return data;
}

// Update a product
async function updateProduct(id, product) {
    const { data, error } = await supabaseClient
        .from('products')
        .update(product)
        .eq('id', id)
        .select();
    
    if (error) {
        console.error('Error updating product:', error);
        return null;
    }
    return data;
}

// Delete a product
async function deleteProduct(id) {
    const { error } = await supabaseClient
        .from('products')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting product:', error);
        return false;
    }
    return true;
}

// ============================================
// CATEGORY FUNCTIONS
// ============================================

// Fetch all categories
async function fetchAllCategories() {
    const { data, error } = await supabaseClient
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
    
    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
    return data;
}

// Add a category
async function addCategory(category) {
    const { data, error } = await supabaseClient
        .from('categories')
        .insert([category])
        .select();
    
    if (error) {
        console.error('Error adding category:', error);
        return null;
    }
    return data;
}

// Update a category
async function updateCategory(id, category) {
    const { data, error } = await supabaseClient
        .from('categories')
        .update(category)
        .eq('id', id)
        .select();
    
    if (error) {
        console.error('Error updating category:', error);
        return null;
    }
    return data;
}

// Delete a category
async function deleteCategory(id) {
    const { error } = await supabaseClient
        .from('categories')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting category:', error);
        return false;
    }
    return true;
}

// ============================================
// SEARCH FUNCTION
// ============================================

async function searchProducts(query) {
    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .ilike('name', `%${query}%`);
    
    if (error) {
        console.error('Error searching products:', error);
        return [];
    }
    return data;
}