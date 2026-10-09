import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, EmptyState } from '@mana/ui';
import { useAuth, MediaService, type MediaAsset } from '@mana/services';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Copy,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Sparkles,
} from 'lucide-react';

export const BusinessMediaScreen: React.FC = () => {
  const { businessId } = useAuth();
  const tenantId = (businessId || 'SLJ001').toUpperCase();

  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<MediaAsset['category']>('banner');
  const [assetName, setAssetName] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Preview modal
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);

  const loadMedia = async () => {
    try {
      const assets = await MediaService.listBusinessMedia(tenantId);
      setMediaList(assets);
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [tenantId]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!assetName.trim()) {
      setUploadError('Asset name is required.');
      return;
    }

    try {
      // Simulate file upload validation
      const simulatedSize = 1024 * 1024 * 1.5; // 1.5 MB
      const validation = MediaService.validateFile({
        name: assetName,
        size: simulatedSize,
        type: 'image/jpeg',
      });

      if (!validation.valid) {
        setUploadError(validation.error || 'Invalid file');
        return;
      }

      await MediaService.uploadMedia(
        tenantId,
        {
          name: assetName.endsWith('.jpg') || assetName.endsWith('.png') ? assetName : `${assetName}.jpg`,
          size: simulatedSize,
          type: 'image/jpeg',
          dataUrl: assetUrl || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
        },
        uploadCategory
      );

      setUploadSuccess('Asset uploaded and cataloged successfully!');
      setTimeout(() => {
        setIsUploadOpen(false);
        setUploadSuccess(null);
        setAssetName('');
        setAssetUrl('');
      }, 1200);

      await loadMedia();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload asset');
    }
  };

  const handleDelete = async (assetId: string) => {
    if (confirm('Are you sure you want to delete this media asset? This action cannot be undone.')) {
      try {
        await MediaService.deleteMedia(tenantId, assetId);
        await loadMedia();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard?.writeText(url);
    alert('Asset URL copied to clipboard: ' + url);
  };

  // Filtered list
  const filteredList = mediaList.filter((m) => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Media Library</h2>
          <p className="text-xs text-[#64748B]">
            Isolated storage repository: <code className="text-[#1677F2] font-mono font-semibold">/{tenantId}/*</code> • Supabase Storage
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setUploadError(null);
            setUploadSuccess(null);
            setIsUploadOpen(true);
          }}
          leftIcon={<Upload size={16} />}
        >
          Upload Asset
        </Button>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search media assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1677F2]"
          />
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto">
          {['all', 'logo', 'banner', 'profile'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs rounded-lg font-semibold capitalize transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#1677F2] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Media Assets */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading media library...</div>
      ) : filteredList.length === 0 ? (
        <EmptyState
          title="No Media Assets Found"
          description="Upload brand logos, festival creatives, or storefront banners."
          action={
            <Button size="sm" variant="primary" onClick={() => setIsUploadOpen(true)}>
              Upload First Asset
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredList.map((asset) => (
            <Card key={asset.id} padding="none" className="overflow-hidden group">
              <div
                className="h-36 bg-slate-100 relative overflow-hidden cursor-pointer"
                onClick={() => setPreviewAsset(asset)}
              >
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2">
                  <Badge variant="neutral" size="sm" className="bg-slate-900/80 text-white backdrop-blur-xs">
                    {asset.category.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="p-3">
                <h5 className="font-semibold text-xs text-slate-900 truncate" title={asset.name}>
                  {asset.name}
                </h5>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>{(asset.size_bytes / 1024).toFixed(0)} KB</span>
                  <span className="font-mono text-[10px]">{asset.dimensions?.width}x{asset.dimensions?.height}</span>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(asset.url)}
                    className="p-1.5 text-slate-500 hover:text-[#1677F2] rounded-lg transition-colors"
                    title="Copy Image URL"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewAsset(asset)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg transition-colors"
                    title="View Full Size"
                  >
                    <ExternalLink size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(asset.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 rounded-lg transition-colors"
                    title="Delete Asset"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* UPLOAD MODAL */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Media Asset"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUploadSubmit} leftIcon={<Upload size={14} />}>
              Upload Asset
            </Button>
          </div>
        }
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-left">
          {uploadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{uploadSuccess}</span>
            </div>
          )}
          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{uploadError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Category
            </label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-[#1677F2]"
            >
              <option value="banner">Banner Creative (2:1 Ratio)</option>
              <option value="logo">Brand Logo (1:1 Ratio)</option>
              <option value="profile">Storefront Photo</option>
              <option value="campaign">Festival Offer Flyer</option>
            </select>
          </div>

          <Input
            label="File Name"
            placeholder="e.g. ugadi_utsavam_2027.jpg"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            required
          />

          <Input
            label="Image URL or Remote Creative Link"
            placeholder="https://..."
            value={assetUrl}
            onChange={(e) => setAssetUrl(e.target.value)}
          />

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <Sparkles size={12} /> Automatic Image Optimization:
            </div>
            <p>
              Uploaded assets are automatically compressed to ~80% quality while maintaining high resolution on mobile screens. Max size limit: 5 MB (JPEG, PNG, WebP).
            </p>
          </div>
        </form>
      </Modal>

      {/* PREVIEW ASSET MODAL */}
      {previewAsset && (
        <Modal
          isOpen={Boolean(previewAsset)}
          onClose={() => setPreviewAsset(null)}
          title={`Asset Preview: ${previewAsset.name}`}
          size="lg"
        >
          <div className="space-y-4 text-left">
            <div className="max-h-96 w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
              <img
                src={previewAsset.url}
                alt={previewAsset.name}
                className="max-h-96 max-w-full object-contain"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Path:</span>
                <span className="font-mono text-slate-800">/{tenantId}/{previewAsset.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MIME Type:</span>
                <span className="font-mono text-slate-800">{previewAsset.mime_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dimensions:</span>
                <span className="font-mono text-slate-800">{previewAsset.dimensions?.width} x {previewAsset.dimensions?.height} px</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyUrl(previewAsset.url)}
                leftIcon={<Copy size={14} />}
              >
                Copy URL
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setPreviewAsset(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
