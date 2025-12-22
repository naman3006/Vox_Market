import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

const buildFormData = (data) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    if (key === 'images' && Array.isArray(value)) {
      value.forEach((file) => {
        formData.append('images', file);
      });
    }
    else {
      formData.append(key, value);
    }
  });

  return formData;
};

export const findAllProducts = createAsyncThunk(
  'products/findAll',
  async (query, { rejectWithValue }) => {
    try {
      const response = await api.get('/products', { params: query });
      return response.data.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to fetch products',
        status: error.response?.status,
      });
    }
  }
);

export const findOneProduct = createAsyncThunk(
  'products/findOne',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to fetch product',
        status: error.response?.status,
      });
    }
  }
);

export const findFeaturedProducts = createAsyncThunk(
  'products/findFeatured',
  async (limit = 8, { rejectWithValue }) => {
    try {
      const response = await api.get('/products/featured', { params: { limit } });
      return response.data.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to fetch featured products',
        status: error.response?.status,
      });
    }
  }
);

export const findRelatedProducts = createAsyncThunk(
  'products/findRelated',
  async ({ id, limit = 4 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/products/${id}/related`, { params: { limit } });
      return response.data.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to fetch related products',
        status: error.response?.status,
      });
    }
  }
);

export const findProductRecommendations = createAsyncThunk(
  'products/findRecommendations',
  async ({ id, limit = 4 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/recommendations/products/${id}`, { params: { limit } });
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to fetch recommendations',
        status: error.response?.status,
      });
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/create',
  async (productData, { rejectWithValue }) => {
    try {
      const formData = productData instanceof FormData ? productData : buildFormData(productData);

      const response = await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data.data;
    } catch (error) {
      console.error('Create product error (full):', error.response?.data || error);
      const respData = error.response?.data;
      let readableMessage = 'Failed to create product';

      if (respData) {
        if (typeof respData.message === 'string') {
          readableMessage = respData.message;
        } else if (Array.isArray(respData.message)) {
          readableMessage = respData.message.join('; ');
        } else if (typeof respData.message === 'object' && respData.message !== null) {
          try {
            const obj = respData.message;
            const firstKey = Object.keys(obj)[0];
            const val = obj[firstKey];
            if (Array.isArray(val)) {
              readableMessage = val.map(v => (typeof v === 'string' ? v : JSON.stringify(v))).join('; ');
            } else if (typeof val === 'string') {
              readableMessage = val;
            } else {
              readableMessage = JSON.stringify(respData.message);
            }
          } catch (e) {
            readableMessage = JSON.stringify(respData.message);
          }
        } else if (typeof respData.error === 'string') {
          readableMessage = respData.error;
        }
      }

      const errorInfo = {
        name: error?.name || null,
        message: error?.message || null,
        code: error?.code || null,
        url: error?.config?.url || null,
        method: error?.config?.method || null,
      };

      return rejectWithValue({
        message: readableMessage,
        status: error.response?.status,
        data: respData,
        errorInfo,
      });
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {

      const formData = data instanceof FormData ? data : buildFormData(data);

      const response = await api.patch(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data.data;
    } catch (error) {
      console.error('Update product error:', error.response?.data || error);
      return rejectWithValue({
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to update product',
        status: error.response?.status,
      });
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/products/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to delete product',
        status: error.response?.status,
      });
    }
  }
);

const initialState = {
  products: [],
  product: null,
  featuredProducts: [],
  relatedProducts: [],
  recommendations: [],
  loading: false,
  featuredLoading: false,
  relatedLoading: false,
  recommendationsLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalProducts: 0,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetProducts: (state) => {
      state.products = [];
      state.currentPage = 1;
    },
    clearProduct: (state) => {
      state.product = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(findAllProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findAllProducts.fulfilled, (state, action) => {
        state.loading = false;
        const newProducts = action.payload.products || [];
        const page = action.payload.page || 1;

        if (page > 1) {
          const existingIds = new Set(state.products.map(p => p._id));
          const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p._id));
          state.products = [...state.products, ...uniqueNewProducts];
        } else {
          state.products = newProducts;
        }

        state.currentPage = page;
        state.totalPages = action.payload.totalPages || 1;
        state.totalProducts = action.payload.total || 0;
      })
      .addCase(findAllProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(findOneProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findOneProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
      })
      .addCase(findOneProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.product = null;
      })

      .addCase(findFeaturedProducts.pending, (state) => {
        state.featuredLoading = true;
        state.error = null;
      })
      .addCase(findFeaturedProducts.fulfilled, (state, action) => {
        state.featuredLoading = false;
        state.featuredProducts = action.payload;
      })
      .addCase(findFeaturedProducts.rejected, (state, action) => {
        state.featuredLoading = false;
        state.error = action.payload;
      })

      .addCase(findRelatedProducts.pending, (state) => {
        state.relatedLoading = true;
        state.error = null;
      })
      .addCase(findRelatedProducts.fulfilled, (state, action) => {
        state.relatedLoading = false;
        state.relatedProducts = action.payload;
      })
      .addCase(findRelatedProducts.rejected, (state, action) => {
        state.relatedLoading = false;
        state.error = action.payload;
      })

      .addCase(findProductRecommendations.pending, (state) => {
        state.recommendationsLoading = true;
        state.error = null;
      })
      .addCase(findProductRecommendations.fulfilled, (state, action) => {
        state.recommendationsLoading = false;
        state.recommendations = action.payload || [];
      })
      .addCase(findProductRecommendations.rejected, (state, action) => {
        state.recommendationsLoading = false;
        state.error = action.payload;
      })

      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.unshift(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const i = state.products.findIndex((p) => p._id === action.payload._id);
        if (i !== -1) state.products[i] = action.payload;
        if (state.product?._id === action.payload._id) {
          state.product = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter((p) => p._id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, resetProducts, clearProduct } = productsSlice.actions;

// Selectors
export const selectAllProducts = (state) => state.products.products;
export const selectProduct = (state) => state.products.product;
export const selectProductsLoading = (state) => state.products.loading;
export const selectProductsError = (state) => state.products.error;
export const selectRecommendations = (state) => state.products.recommendations;
export const selectPagination = (state) => ({
  currentPage: state.products.currentPage,
  totalPages: state.products.totalPages,
  totalProducts: state.products.totalProducts,
});

export default productsSlice.reducer;
