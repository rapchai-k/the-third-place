import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Package, Tag, DollarSign, Plus, Minus, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface AddEquipmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EquipmentFormData {
  name: string;
  category: string;
  current_price: number;
  is_chargeable: boolean;
  is_active: boolean;
}

interface StockInfo {
  currentStock: number;
  totalDistributed: number;
  netAvailable: number;
}

export function AddEquipmentForm({ isOpen, onClose, onSuccess }: AddEquipmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sizes, setSizes] = useState<string[]>(['One Size']);
  const [stockInfo, setStockInfo] = useState<StockInfo>({ currentStock: 0, totalDistributed: 0, netAvailable: 0 });
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [existingEquipment, setExistingEquipment] = useState<any[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<EquipmentFormData>();

  const watchedName = watch('name');

  // Load existing equipment for stock checking
  useEffect(() => {
    if (isOpen) {
      loadExistingEquipment();
    }
  }, [isOpen]);

  // Check stock when equipment name changes
  useEffect(() => {
    if (watchedName && existingEquipment.length > 0) {
      checkCurrentStock(watchedName);
    } else {
      setStockInfo({ currentStock: 0, totalDistributed: 0, netAvailable: 0 });
    }
  }, [watchedName, existingEquipment]);

  const loadExistingEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment_items')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setExistingEquipment(data || []);
    } catch (error) {
      console.error('Failed to load equipment:', error);
    }
  };

  const checkCurrentStock = async (equipmentName: string) => {
    if (!equipmentName) return;
    
    setLoadingStock(true);
    try {
      // Find equipment item
      const equipment = existingEquipment.find(eq => eq.name.toLowerCase() === equipmentName.toLowerCase());
      if (!equipment) {
        setStockInfo({ currentStock: 0, totalDistributed: 0, netAvailable: 0 });
        return;
      }

      // Get current stock levels
      const { data: stockData, error: stockError } = await supabase
        .from('equipment_stock_levels')
        .select('stock_count')
        .eq('equipment_item_id', equipment.id);

      if (stockError) throw stockError;

      // Get total distributed (negative transactions)
      const { data: distributedData, error: distributedError } = await supabase
        .from('equipment_stock_transactions')
        .select('quantity')
        .eq('equipment_item_id', equipment.id)
        .eq('transaction_type', 'distribution');

      if (distributedError) throw distributedError;

      const currentStock = stockData?.reduce((sum, item) => sum + (Number(item.stock_count) || 0), 0) || 0;
      const totalDistributed = Math.abs(distributedData?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0);
      const netAvailable = Math.max(0, currentStock - totalDistributed);

      setStockInfo({ currentStock, totalDistributed, netAvailable });
      setSelectedEquipment(equipment.id);
    } catch (error) {
      console.error('Failed to check stock:', error);
      setStockInfo({ currentStock: 0, totalDistributed: 0, netAvailable: 0 });
    } finally {
      setLoadingStock(false);
    }
  };

  const addSize = () => {
    setSizes([...sizes, '']);
  };

  const removeSize = (index: number) => {
    if (sizes.length > 1) {
      setSizes(sizes.filter((_, i) => i !== index));
    }
  };

  const updateSize = (index: number, value: string) => {
    const newSizes = [...sizes];
    newSizes[index] = value;
    setSizes(newSizes);
  };

  const onSubmit = async (data: EquipmentFormData) => {
    setIsSubmitting(true);
    try {
      const filteredSizes = sizes.filter(size => size.trim() !== '');
      
      // If this is an existing equipment, add stock instead of creating new item
      if (selectedEquipment && stockInfo.currentStock > 0) {
        // Add new stock transaction
        const { error: stockError } = await supabase
          .from('equipment_stock_transactions')
          .insert([{
            equipment_item_id: selectedEquipment,
            size: filteredSizes[0] || null, // Use first size for stock
            transaction_type: 'inbound',
            quantity: newQuantity,
            supplier_name: 'Manual Addition',
            delivery_date: new Date().toISOString().split('T')[0],
            notes: `Manual stock addition - ${newQuantity} units`,
            reference_type: 'manual_addition'
          }]);

        if (stockError) throw stockError;

        // The final available stock will be the new quantity (replacing current available)
        toast.success(`Added ${newQuantity} units to existing equipment. New available stock: ${newQuantity} units`);
      } else {
        // Create new equipment item
        const { error } = await supabase
          .from('equipment_items')
          .insert([{
            ...data,
            sizes: filteredSizes.length > 0 ? filteredSizes : ['One Size']
          }]);

        if (error) throw error;

        // If quantity specified, add initial stock
        if (newQuantity > 0) {
          const { data: newItem, error: itemError } = await supabase
            .from('equipment_items')
            .select('id')
            .eq('name', data.name)
            .single();

          if (itemError) throw itemError;

          const { error: stockError } = await supabase
            .from('equipment_stock_transactions')
            .insert([{
              equipment_item_id: newItem.id,
              size: filteredSizes[0] || null,
              transaction_type: 'inbound',
              quantity: newQuantity,
              supplier_name: 'Initial Stock',
              delivery_date: new Date().toISOString().split('T')[0],
              notes: `Initial stock - ${newQuantity} units`,
              reference_type: 'initial_stock'
            }]);

          if (stockError) throw stockError;

          toast.success(`Equipment created with ${newQuantity} initial units`);
        } else {
          toast.success('Equipment added successfully');
        }
      }

      reset();
      setSizes(['One Size']);
      setNewQuantity(0);
      setStockInfo({ currentStock: 0, totalDistributed: 0, netAvailable: 0 });
      setSelectedEquipment('');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add equipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isExistingEquipment = stockInfo.currentStock > 0;
  // When adding stock to existing equipment, the final available becomes the new quantity
  const finalAvailableStock = isExistingEquipment ? newQuantity : newQuantity;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add Equipment Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Equipment Name *
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register('name', { required: 'Equipment name is required' })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter equipment name"
              />
            </div>
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Stock Information Display */}
          {watchedName && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Stock Information</span>
              </div>
              {loadingStock ? (
                <div className="text-sm text-blue-700">Checking current stock...</div>
              ) : isExistingEquipment ? (
                <div className="space-y-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="font-semibold text-blue-800 mb-2">Stock Calculation</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><strong>Current Inbound:</strong> {stockInfo.currentStock} units</div>
                    <div><strong>Overall Distributed:</strong> {stockInfo.totalDistributed} units</div>
                  </div>
                  <div className="border-t border-blue-300 pt-2 mt-2">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-800">
                        {stockInfo.currentStock} - {stockInfo.totalDistributed} = {stockInfo.netAvailable} units
                      </div>
                      <div className="text-xs text-blue-600">Current Available Stock</div>
                    </div>
                  </div>
                  <div className="border-t border-blue-300 pt-2 mt-2">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-700">
                        Adding {newQuantity} units
                      </div>
                      <div className="text-xs text-green-600">
                        Final Available: {newQuantity} units (replaces current available)
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-blue-700">
                  <div><strong>New Equipment:</strong> This will create a new equipment item</div>
                  {newQuantity > 0 && (
                    <div className="text-xs text-blue-600 mt-1">
                      Initial stock will be {newQuantity} units
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quantity Input for Stock Addition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isExistingEquipment ? 'Add Stock Quantity' : 'Initial Stock Quantity (Optional)'}
            </label>
            <input
              type="number"
              min="0"
              value={newQuantity}
              onChange={(e) => setNewQuantity(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={isExistingEquipment ? "Enter quantity to add" : "Enter initial stock quantity"}
            />
            <p className="text-xs text-gray-500 mt-1">
              {isExistingEquipment 
                ? `This will replace the current available stock (${stockInfo.netAvailable} units) with ${newQuantity} units. The ${stockInfo.totalDistributed} distributed units remain unchanged.`
                : "Leave empty to create equipment without initial stock"
              }
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                <option value="safety">Safety Equipment</option>
                <option value="clothing">Clothing</option>
                <option value="accessories">Accessories</option>
                <option value="tools">Tools</option>
                <option value="general">General</option>
              </select>
            </div>
            {errors.category && (
              <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Available Sizes
            </label>
            <div className="space-y-2">
              {sizes.map((size, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    value={size}
                    onChange={(e) => updateSize(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter size"
                  />
                  {sizes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSize(index)}
                      className="p-2 text-red-600 hover:text-red-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addSize}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Size</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register('current_price', { 
                  required: 'Price is required',
                  min: { value: 0, message: 'Price must be positive' }
                })}
                type="number"
                step="0.01"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            {errors.current_price && (
              <p className="text-red-600 text-sm mt-1">{errors.current_price.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                {...register('is_chargeable')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Chargeable item (riders will be charged for this)
              </label>
            </div>

            <div className="flex items-center">
              <input
                {...register('is_active')}
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Active (available for distribution)
              </label>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : isExistingEquipment ? 'Add Stock' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}