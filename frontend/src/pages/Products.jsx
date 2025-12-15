import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  findAllProducts,
  selectAllProducts,
  selectProductsLoading,
  selectProductsError,
  selectPagination,
  clearError,
} from "../store/slices/productsSlice";
import {
  findAllCategories,
  selectAllCategories,
} from "../store/slices/categoriesSlice";
import ProductCard from "../components/ProductCard/ProductCard";
import { toast } from "react-toastify";
import useVoiceSearch from "../hooks/useVoiceSearch";
import { parseVoiceCommand } from "../utils/voiceUtils";

import { useSearchParams } from "react-router-dom";

const Products = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux selectors
  const products = useSelector(selectAllProducts);
  const loading = useSelector(selectProductsLoading);
  const error = useSelector(selectProductsError);
  const pagination = useSelector(selectPagination);
  const categories = useSelector(selectAllCategories);

  // Local state
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [filters, setFilters] = useState({
    category: "",
    search: searchParams.get("search") || "",
    minPrice: "",
    maxPrice: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    limit: 20,
  });

  const { isListening, transcript, interimTranscript, startListening, error: voiceError } = useVoiceSearch();

  // Handle voice search results
  useEffect(() => {
    if (transcript) {
      const updates = parseVoiceCommand(transcript, categories);
      if (updates) {
        setFilters(prev => ({ ...prev, ...updates, page: 1 }));
        if (updates.search) setSearchTerm(updates.search);

        // Show feedback
        const feedback = [];
        if (updates.category) feedback.push(`Category set to ${categories.find(c => c._id === updates.category)?.name}`);
        if (updates.minPrice) feedback.push(`Min price: ${updates.minPrice}`);
        if (updates.maxPrice) feedback.push(`Max price: ${updates.maxPrice}`);
        if (updates.sortBy) feedback.push(`Sorted by ${updates.sortBy}`);
        if (updates.search) feedback.push(`Searching for "${updates.search}"`);

        if (feedback.length > 0) {
          toast.success(`Voice command recognized: ${feedback.join(", ")}`);
        }
      }
    }
  }, [transcript, categories]);

  // Handle voice errors
  useEffect(() => {
    if (voiceError) {
      toast.error(voiceError);
    }
  }, [voiceError]);

  // Sync searchTerm with URL and debounce update filters
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => {
        if (prev.search === searchTerm) return prev;
        return { ...prev, search: searchTerm, page: 1 };
      });

      // Update URL
      if (searchTerm) {
        searchParams.set("search", searchTerm);
      } else {
        searchParams.delete("search");
      }
      setSearchParams(searchParams, { replace: true });
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm, searchParams]);

  // Memoize filters to avoid unnecessary re-renders
  const memoizedFilters = useMemo(
    () => ({
      ...filters,
      minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
    }),
    [filters]
  );

  // Fetch products on mount and when filters change
  useEffect(() => {
    dispatch(findAllProducts(memoizedFilters));
  }, [dispatch, memoizedFilters]);

  // Fetch categories on mount
  useEffect(() => {
    dispatch(findAllCategories());
  }, [dispatch]);

  // Handle filter changes
  const handleFilterChange = useCallback((key, value) => {
    if (key === 'search') {
      setSearchTerm(value);
      return;
    }
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === "page" ? value : 1, // Reset to page 1 when changing filters
    }));
  }, []);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to load products");
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 font-display tracking-tight">Discover Products</h1>
          <p className="text-gray-500 mt-2 text-lg">
            Explore our curated collection of {pagination.totalProducts} items
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 transition-all duration-300 hover:shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 font-display flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            Refine Selection
          </h2>
          <button
            onClick={() => {
              setSearchTerm("");
              setFilters({
                category: "",
                search: "",
                minPrice: "",
                maxPrice: "",
                sortBy: "createdAt",
                sortOrder: "desc",
                page: 1,
                limit: 20,
              });
            }}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors"
          >
            Clear all filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Search Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder={isListening ? "Listening..." : "Search products..."}
                value={isListening ? (interimTranscript || transcript) : searchTerm}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none ${isListening ? 'placeholder-red-400' : ''}`}
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <button
                onClick={startListening}
                className={`absolute right-3 top-2.5 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-primary-600'}`}
                title="Voice Search"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                min="0"
              />
              <span className="text-gray-400 self-center">-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                min="0"
              />
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sort By</label>
            <div className="flex gap-2">
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="w-2/3 px-4 py-2.5 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none cursor-pointer"
              >
                <option value="createdAt">Newest</option>
                <option value="price">Price</option>
                <option value="rating">Rating</option>
                <option value="soldCount">Popularity</option>
              </select>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
                className="w-1/3 px-4 py-2.5 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none cursor-pointer"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 && !loading ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-soft border border-gray-100">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <p className="text-gray-900 text-lg font-medium">No products found</p>
          <p className="text-gray-500 mt-1 max-w-sm mx-auto">We couldn't find any items matching your filters. Try adjusting your search or range.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product._id} className="animate-fade-in">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}

      {/* Loading indicator for pagination */}
      {loading && products.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Pagination Info */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-soft border border-gray-100 gap-4">
          <span className="text-gray-600 font-medium text-sm text-center sm:text-left">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <div className="flex gap-3 w-full sm:w-auto justify-center">
            <button
              onClick={() => handleFilterChange("page", Math.max(1, pagination.currentPage - 1))}
              disabled={pagination.currentPage === 1}
              className="px-5 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-primary-600 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-gray-400 transition-colors flex-1 sm:flex-initial"
            >
              Previous
            </button>
            <button
              onClick={() => handleFilterChange("page", Math.min(pagination.totalPages, pagination.currentPage + 1))}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-5 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-primary-600 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-gray-400 transition-colors flex-1 sm:flex-initial"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
