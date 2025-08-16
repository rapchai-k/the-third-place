import { useState, useEffect } from 'react';
import { supabase, type ProjectSchema, type ProjectData } from '../lib/supabase';
import toast from 'react-hot-toast';

export function useProjectSchema(projectId: string | null) {
  const [schemas, setSchemas] = useState<ProjectSchema[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchSchemas();
    } else {
      setSchemas([]);
    }
  }, [projectId]);

  const fetchSchemas = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_schemas')
        .select('*')
        .eq('project_id', projectId)
        .order('column_name');

      if (error) throw error;
      setSchemas(data || []);
    } catch (error) {
      console.error('Error fetching project schemas:', error);
      toast.error('Failed to load project schema');
    } finally {
      setLoading(false);
    }
  };

  const createSchema = async (tableName: string, columns: Array<{
    name: string;
    type: string;
    required: boolean;
    displayName?: string;
  }>) => {
    if (!projectId) return false;

    try {
      const schemaData = columns.map(col => ({
        project_id: projectId,
        table_name: tableName,
        column_name: col.name,
        column_type: col.type,
        is_required: col.required,
        is_filterable: true,
        display_name: col.displayName || col.name
      }));

      const { error } = await supabase
        .from('project_schemas')
        .upsert(schemaData, { onConflict: 'project_id,table_name,column_name' });

      if (error) throw error;
      
      await fetchSchemas();
      return true;
    } catch (error) {
      console.error('Error creating schema:', error);
      toast.error('Failed to create project schema');
      return false;
    }
  };

  const getSchemaForTable = (tableName: string) => {
    return schemas.filter(schema => schema.table_name === tableName);
  };

  const getFilterableColumns = (tableName: string) => {
    return schemas
      .filter(schema => schema.table_name === tableName && schema.is_filterable)
      .map(schema => ({
        key: schema.column_name,
        label: schema.display_name || schema.column_name,
        type: schema.column_type === 'boolean' ? 'select' as const : 
              schema.column_type === 'date' ? 'date' as const : 'text' as const,
        options: schema.column_type === 'boolean' ? [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' }
        ] : undefined
      }));
  };

  const getFilterOptionsForColumn = async (projectId: string, columnName: string) => {
    try {
      // Use a more efficient query with DISTINCT and LIMIT
      const { data, error } = await supabase
        .rpc('get_distinct_column_values', {
          project_id_param: projectId,
          table_name_param: 'riders',
          column_name_param: columnName,
          max_values: 20
        });

      if (error) {
        // Fallback to original method if RPC doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('project_data')
          .select('data')
          .eq('project_id', projectId)
          .eq('table_name', 'riders')
          .limit(1000); // Limit to first 1000 records for performance

        if (fallbackError) throw fallbackError;
        
        // Extract unique values more efficiently
        const uniqueValues = new Set();
        fallbackData?.forEach(item => {
          const value = item.data[columnName];
          if (value !== null && value !== undefined && value !== '') {
            uniqueValues.add(String(value));
            // Stop if we have enough unique values
            if (uniqueValues.size > 20) return;
          }
        });

        const uniqueArray = Array.from(uniqueValues);
        
        if (uniqueArray.length > 0 && uniqueArray.length <= 20) {
          return uniqueArray.sort().map(value => ({
            value: String(value),
            label: String(value)
          }));
        }
        
        return null;
      }

      if (data && data.length > 0 && data.length <= 20) {
        return data.map((item: any) => ({
          value: String(item.value),
          label: String(item.value)
        }));
      }
      
      return null;
    } catch (error) {
      console.error('Error getting filter options:', error);
      return null;
    }
  };

  const getFilterOptionsForColumnOptimized = async (projectId: string, columnName: string) => {
    try {
      // Use a smaller sample for faster queries with timeout protection
      const { data, error } = await supabase
        .from('project_data')
        .select('data')
        .eq('project_id', projectId)
        .eq('table_name', 'riders')
        .limit(100); // Reasonable limit for speed

      if (error) throw error;

      const uniqueValues = new Set();
      
      data?.forEach(item => {
        if (uniqueValues.size >= 15) return; // Early exit
        const value = item.data[columnName];
        if (value !== null && value !== undefined && value !== '') {
          uniqueValues.add(String(value));
        }
      });

      const uniqueArray = Array.from(uniqueValues);
      
      // Only create filter options if there are very limited unique values
      if (uniqueArray.length > 0 && uniqueArray.length <= 15) {
        return uniqueArray.sort().map(value => ({
          value: String(value),
          label: String(value)
        }));
      }
      
      return null;
    } catch (error) {
      console.error('Error getting filter options:', error);
      return null;
    }
  };

  const getFilterableColumnsWithOptions = async (tableName: string) => {
    if (!projectId) return [];
    
    try {
      const schemaColumns = schemas
        .filter(schema => schema.table_name === tableName && schema.is_filterable)
        .filter(schema => {
          // Remove city_id and identity card number from filters
          const columnName = schema.column_name.toLowerCase();
          return !columnName.includes('city_id') && 
                 !columnName.includes('identity_card') &&
                 !columnName.includes('id_card') &&
                 !columnName.includes('card_number') &&
                 !columnName.includes('mobile') &&
                 !columnName.includes('phone');
        })
        .sort((a, b) => (a.column_order || 0) - (b.column_order || 0))
        .slice(0, 6); // Limit to 6 columns for better performance

      const columnsWithOptions = await Promise.all(
        schemaColumns.map(async (schema) => {
          try {
            let options = undefined;
            
            if (schema.column_type === 'boolean') {
              options = [
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' }
              ];
            } else if (schema.column_type === 'text') {
              // Get unique values for text columns with timeout
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 2000)
              );
              
              try {
                options = await Promise.race([
                  getFilterOptionsForColumnOptimized(projectId, schema.column_name),
                  timeoutPromise
                ]);
              } catch (error) {
                // Timeout or error - use text input
                options = null;
              }
            }

            return {
              key: schema.column_name,
              label: schema.display_name || schema.column_name,
              type: schema.column_type === 'boolean' ? 'select' as const : 
                    schema.column_type === 'date' ? 'date' as const : 
                    options ? 'select' as const : 'text' as const,
              options
            };
          } catch (error) {
            // Add as text filter if processing fails
            return {
              key: schema.column_name,
              label: schema.display_name || schema.column_name,
              type: 'text' as const,
              options: undefined
            };
          }
        })
      );
      
      return columnsWithOptions;
    } catch (error) {
      console.error('Error getting filterable columns:', error);
      // Return basic text filters as fallback
      return schemas
        .filter(schema => schema.table_name === tableName)
        .slice(0, 3)
        .map(schema => ({
          key: schema.column_name,
          label: schema.display_name || schema.column_name,
          type: 'text' as const,
          options: undefined
        }));
    }
  };

  const getFilterableColumnsWithOptionsOld = async (tableName: string) => {
    if (!projectId) return [];
    
    const schemaColumns = schemas
      .filter(schema => schema.table_name === tableName && schema.is_filterable)
      .sort((a, b) => (a.column_order || 0) - (b.column_order || 0)); // Maintain file order

    const columnsWithOptions = await Promise.all(
      schemaColumns.map(async (schema) => {
        let options = undefined;
        
        if (schema.column_type === 'boolean') {
          options = [
            { value: 'true', label: 'Yes' },
            { value: 'false', label: 'No' }
          ];
        } else if (schema.column_type === 'text') {
          // Get unique values for text columns
          options = await getFilterOptionsForColumnOptimized(projectId, schema.column_name);
        }

        return {
          key: schema.column_name,
          label: schema.display_name || schema.column_name,
          type: schema.column_type === 'boolean' ? 'select' as const : 
                schema.column_type === 'date' ? 'date' as const : 
                options ? 'select' as const : 'text' as const,
          options
        };
      })
    );

    return columnsWithOptions;
  };

  return {
    schemas,
    loading,
    createSchema,
    getSchemaForTable,
    getFilterableColumns,
    getFilterableColumnsWithOptions,
    refreshSchemas: fetchSchemas
  };
}

export function useProjectData(projectId: string | null, tableName: string) {
  const [data, setData] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (projectId && tableName) {
      fetchData(true); // Reset data on project/table change
    } else {
      setData([]);
      setTotalCount(0);
      setHasMore(true);
    }
  }, [projectId, tableName]);

  const fetchData = async (reset = false, limit = 100, offset = 0) => {
    if (!projectId || !tableName) return;
    
    setLoading(true);
    try {
      // Get total count first (only on reset)
      if (reset) {
        const { count } = await supabase
          .from('project_data')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId)
          .eq('table_name', tableName);
        
        setTotalCount(count || 0);
      }
      
      // Fetch paginated data
      const { data: projectData, error } = await supabase
        .from('project_data')
        .select('*')
        .eq('project_id', projectId)
        .eq('table_name', tableName)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }
      
      if (reset) {
        setData(projectData || []);
      } else {
        setData(prev => [...prev, ...(projectData || [])]);
      }
      
      setHasMore((projectData?.length || 0) === limit);
    } catch (error) {
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!loading && hasMore) {
      await fetchData(false, 100, data.length);
    }
  };

  const insertData = async (records: Record<string, any>[]) => {
    if (!projectId || !tableName) return false;

    try {
      const dataRecords = records.map(record => ({
        project_id: projectId,
        table_name: tableName,
        data: record
      }));

      const { error } = await supabase
        .from('project_data')
        .insert(dataRecords);

      if (error) throw error;
      
      await fetchData(true);
      return true;
    } catch (error) {
      console.error('Error inserting project data:', error);
      toast.error('Failed to insert data');
      return false;
    }
  };

  const updateData = async (id: string, newData: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from('project_data')
        .update({ data: newData })
        .eq('id', id);

      if (error) throw error;
      
      await fetchData(true);
      return true;
    } catch (error) {
      console.error('Error updating project data:', error);
      toast.error('Failed to update data');
      return false;
    }
  };

  const deleteData = async (id: string) => {
    try {
      const { error } = await supabase
        .from('project_data')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchData(true);
      return true;
    } catch (error) {
      console.error('Error deleting project data:', error);
      toast.error('Failed to delete data');
      return false;
    }
  };

  return {
    data,
    totalCount,
    hasMore,
    loading,
    loadMore,
    insertData,
    updateData,
    deleteData,
    refreshData: () => fetchData(true)
  };
}