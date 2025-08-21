const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Create Supabase client for public operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase client for admin operations (with service key)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Database helper functions
const db = {
  // Get Supabase client for public operations
  getClient: () => supabase,
  
  // Get Supabase client for admin operations
  getAdminClient: () => supabaseAdmin,
  
  // Generic query function
  async query(table, options = {}) {
    try {
      let query = supabase.from(table);
      
      if (options.select) {
        query = query.select(options.select);
      }
      
      if (options.where) {
        Object.keys(options.where).forEach(key => {
          query = query.eq(key, options.where[key]);
        });
      }
      
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    } catch (error) {
      console.error(`Database query error in ${table}:`, error);
      throw error;
    }
  },
  
  // Insert data
  async insert(table, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return result[0];
    } catch (error) {
      console.error(`Database insert error in ${table}:`, error);
      throw error;
    }
  },
  
  // Update data
  async update(table, id, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return result[0];
    } catch (error) {
      console.error(`Database update error in ${table}:`, error);
      throw error;
    }
  },
  
  // Delete data
  async delete(table, id) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return true;
    } catch (error) {
      console.error(`Database delete error in ${table}:`, error);
      throw error;
    }
  },
  
  // Find by ID
  async findById(table, id) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    } catch (error) {
      console.error(`Database findById error in ${table}:`, error);
      throw error;
    }
  },
  
  // Find by field
  async findByField(table, field, value) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(field, value)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    } catch (error) {
      console.error(`Database findByField error in ${table}:`, error);
      throw error;
    }
  }
};

module.exports = db;
