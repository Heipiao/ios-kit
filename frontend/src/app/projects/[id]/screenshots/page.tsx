"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PaywallModal } from "@/components/PaywallModal";
import ScreenshotEditorShell from "@/components/screenshot-editor/ScreenshotEditorShell";
import { useScreenshotEditorState } from "@/hooks/useScreenshotEditorState";
import { DEFAULT_DEVICE_FRAME_ASSET_ID } from "@/lib/device-frame-assets";
import { MOCK_LAYER_TREE_CONFIG } from "@/lib/layer-tree-mock";
import { ApiError, getAssetContentUrl, getProject, type Project, type ProjectEntitlementSummary, saveScreenshotConfig, updateProject, uploadAsset, validateScreenshotExportAccess } from "@/lib/api-projects";
import { applyAssetToLayerFrame, buildConfigForDevice, createSlideForDevice, sanitizeConfigAssetRefs, sanitizeFilename, scaleConfigToDevice, type DeviceType, type LayerAssetDebugInfo, type ScreenshotAsset } from "@/lib/screenshot-editor";
import type { AiLayerTreeConfig, DeviceLayer, ImageLayer } from "@/lib/layer-tree-types";

const INITIAL_SCREEN_LIMIT = 2;

export default function ScreenshotEditorPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [entitlementSummary, setEntitlementSummary] = useState<ProjectEntitlementSummary | null>(null);
  const [uploads, setUploads] = useState<ScreenshotAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType>("iphone_67");
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [initialConfig, setInitialConfig] = useState<AiLayerTreeConfig>(MOCK_LAYER_TREE_CONFIG);
  const [debugAssets, setDebugAssets] = useState<LayerAssetDebugInfo[]>([]);
  const [paywallPlan, setPaywallPlan] = useState<"base" | "pro" | null>(null);
  const [paywallFeature, setPaywallFeature] = useState("HD screenshot export");
  const [paywallSecondaryActionLabel, setPaywallSecondaryActionLabel] = useState<string | null>(null);

  const editor = useScreenshotEditorState({
    initialConfig,
    projectName: project?.name || "Project",
    selectedDeviceType,
    onDirtyChange: () => setSaveState("idle"),
  });

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProject(projectId);
      setProject(data.project);
      setEntitlementSummary(data.entitlementSummary || null);

      const screenshots = data.assets.filter((asset) => asset.type === "screenshot");
      const projectAssets: ScreenshotAsset[] = data.assets.map((asset) => ({
        id: asset.id,
        name: asset.filename,
        previewUrl: getAssetContentUrl(asset.id),
        sourceUrl: getAssetContentUrl(asset.id),
        width: asset.width || 1284,
        height: asset.height || 2778,
      }));
      const screenshotAssets = projectAssets.filter((asset) => {
        return screenshots.some((screenshot) => screenshot.id === asset.id);
      });
      setUploads(projectAssets);
      const validAssetIds = new Set(projectAssets.map((asset) => asset.id));

      const initialDevice = (data.project.deviceType as DeviceType | undefined) || "iphone_67";
      setSelectedDeviceType(initialDevice);

      if (data.screenshotConfig?.userEdited) {
        const sanitized = sanitizeConfigAssetRefs(data.screenshotConfig.userEdited, validAssetIds);
        setInitialConfig(sanitized.config);
        if (sanitized.changed) {
          void saveScreenshotConfig(projectId, sanitized.config, "user_edited").catch((saveError) => {
            console.error("[screenshots] failed to resave sanitized config", saveError);
          });
        }
      } else if (screenshots.length > 0) {
        setInitialConfig(
          buildConfigForDevice(
            data.project.name,
            screenshotAssets.slice(0, INITIAL_SCREEN_LIMIT),
            initialDevice
          )
        );
      } else {
        setInitialConfig({
          version: "1.0",
          exportedPngSize: scaleConfigToDevice(MOCK_LAYER_TREE_CONFIG, initialDevice).exportedPngSize,
          device: { frameRef: DEFAULT_DEVICE_FRAME_ASSET_ID },
          slides: [createSlideForDevice(data.project.name, 1, initialDevice)],
        });
      }

      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const readFileImageSize = useCallback((file: File) => {
    return new Promise<{ width: number; height: number }>((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new window.Image();

      image.onload = () => {
        resolve({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height });
        URL.revokeObjectURL(objectUrl);
      };

      image.onerror = () => {
        resolve({ width: 0, height: 0 });
        URL.revokeObjectURL(objectUrl);
      };

      image.src = objectUrl;
    });
  }, []);

  const readFileDataUrl = useCallback((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(reader.error || new Error("Failed to read file as data URL"));
      reader.readAsDataURL(file);
    });
  }, []);

  const uploadScreenshotAsset = useCallback(async (file: File) => {
    if (!project) {
      return null;
    }

    try {
      setUploadingScreenshot(true);
      const [result, imageSize, dataUrl] = await Promise.all([
        uploadAsset(file, "screenshot", project.id),
        readFileImageSize(file),
        readFileDataUrl(file),
      ]);
      const sourceUrl = getAssetContentUrl(result.asset.id);
      const nextUpload: ScreenshotAsset = {
        id: result.asset.id,
        name: result.asset.filename,
        previewUrl: dataUrl || sourceUrl,
        sourceUrl,
        width: imageSize.width || result.asset.width || 1284,
        height: imageSize.height || result.asset.height || 2778,
      };

      setUploads((current) => {
        const others = current.filter((item) => item.id !== nextUpload.id);
        return [...others, nextUpload];
      });

      return nextUpload;
    } catch (err) {
      console.error(err);
      setError("Failed to upload screenshot");
      return null;
    } finally {
      setUploadingScreenshot(false);
    }
  }, [project, readFileDataUrl, readFileImageSize]);

  const handleUploadCurrentSlideImage = useCallback(async (file: File) => {
    const nextUpload = await uploadScreenshotAsset(file);
    if (!nextUpload || !editor.currentDeviceLayer) {
      return;
    }

    editor.actions.updateLayer(
      applyAssetToLayerFrame(editor.currentDeviceLayer, nextUpload, editor.config.exportedPngSize)
    );
  }, [editor.actions, editor.config.exportedPngSize, editor.currentDeviceLayer, uploadScreenshotAsset]);

  const handleUploadLayerAsset = useCallback(async (layerId: string, file: File) => {
    const nextUpload = await uploadScreenshotAsset(file);
    if (!nextUpload) {
      return;
    }

    const layer = editor.config.slides
      .flatMap((slide) => slide.layers)
      .find((current): current is ImageLayer | DeviceLayer => {
        return current.id === layerId && (current.type === "image" || current.type === "device");
      });

    if (!layer) {
      return;
    }

    editor.actions.updateLayer(
      applyAssetToLayerFrame(layer, nextUpload, editor.config.exportedPngSize)
    );
  }, [editor.actions, editor.config.exportedPngSize, editor.config.slides, uploadScreenshotAsset]);

  const downloadDataUrl = useCallback((dataUrl: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${sanitizeFilename(project?.name || "screenshot")}-page-${editor.currentSlideIndex + 1}.png`;
    link.click();
  }, [editor.currentSlideIndex, project?.name]);

  const createPreviewExport = useCallback((dataUrl: string) => {
    return new Promise<string>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => {
        const scale = 0.45;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Failed to create export canvas"));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        context.fillStyle = "rgba(0, 0, 0, 0.6)";
        context.fillRect(0, canvas.height - 88, canvas.width, 88);
        context.fillStyle = "#ffffff";
        context.font = "bold 28px Arial";
        context.textAlign = "center";
        context.fillText("Preview export - Upgrade for HD", canvas.width / 2, canvas.height - 34);
        resolve(canvas.toDataURL("image/png"));
      };
      image.onerror = () => reject(new Error("Failed to render preview export"));
      image.src = dataUrl;
    });
  }, []);

  const handleExportReady = useCallback(async (dataUrl: string) => {
    if (entitlementSummary?.screenshotHdExportEnabled) {
      downloadDataUrl(dataUrl);
      return;
    }

    try {
      const previewDataUrl = await createPreviewExport(dataUrl);
      downloadDataUrl(previewDataUrl);
      setError("Downloaded a watermarked preview. Upgrade to Base for HD export.");
    } catch (err) {
      console.error(err);
      setError("Failed to export preview image");
    }
  }, [createPreviewExport, downloadDataUrl, entitlementSummary?.screenshotHdExportEnabled]);

  const handleRequestExport = useCallback(async () => {
    if (!entitlementSummary?.screenshotHdExportEnabled) {
      setPaywallPlan("base");
      setPaywallFeature("HD export and watermark-free download");
      setPaywallSecondaryActionLabel("Keep preview download");
      return;
    }

    try {
      const result = await validateScreenshotExportAccess(projectId);
      if (result.entitlementSummary) {
        setEntitlementSummary(result.entitlementSummary);
      }
      editor.actions.requestExport();
    } catch (err) {
      if (err instanceof ApiError && err.status === 402 && typeof err.detail === "object") {
        setPaywallPlan(err.detail.targetPlan || "base");
        setPaywallFeature(err.detail.message || "HD screenshot export");
        setPaywallSecondaryActionLabel(null);
        return;
      }
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to validate export access");
    }
  }, [editor.actions, entitlementSummary?.screenshotHdExportEnabled, projectId]);

  const handleSave = useCallback(async () => {
    try {
      setSaveState("saving");
      await saveScreenshotConfig(projectId, editor.config, "user_edited");
      setSaveState("saved");
      setLastSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
      setSaveState("error");
    }
  }, [editor.config, projectId]);

  const handleDeviceTypeChange = useCallback(async (nextDeviceType: DeviceType) => {
    if (nextDeviceType === selectedDeviceType) {
      return;
    }

    setSelectedDeviceType(nextDeviceType);
    editor.actions.replaceConfig(scaleConfigToDevice(editor.config, nextDeviceType));
    setProject((current) => (current ? { ...current, deviceType: nextDeviceType } : current));

    try {
      await updateProject(projectId, { deviceType: nextDeviceType });
    } catch (err) {
      console.error(err);
      setError("Failed to save device size");
    }
  }, [editor.actions, editor.config, projectId, selectedDeviceType]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
          <p className="text-sm font-mono uppercase tracking-wider">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-4 text-sm font-mono text-red-600">{error || "Project not found"}</p>
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-sm font-bold uppercase transition-colors hover:bg-yellow-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScreenshotEditorShell
        config={editor.config}
        currentDeviceLayer={editor.currentDeviceLayer || null}
        currentSlideIndex={editor.currentSlideIndex}
        errorMessage={error}
        exportRequest={editor.exportRequest}
        historyIndex={editor.historyIndex}
        historyLength={editor.history.length}
        inspectorLayer={editor.inspectorLayer}
        isUploadingImage={uploadingScreenshot}
        lastSavedAt={lastSavedAt}
        debugAssets={debugAssets}
        onAddLayer={editor.actions.addLayer}
        onCreateSlide={editor.actions.createSlide}
        onDebugAssetsChange={setDebugAssets}
        onDeleteLayer={editor.actions.deleteLayer}
        onDeleteSlide={editor.actions.deleteSlide}
        onDeviceTypeChange={handleDeviceTypeChange}
        onExportReady={handleExportReady}
        onMoveLayerDown={editor.actions.moveLayerDown}
        onMoveLayerUp={editor.actions.moveLayerUp}
        onRequestExport={handleRequestExport}
        onRedo={editor.actions.redo}
        onSave={handleSave}
        onSelectLayer={editor.setSelectedLayerId}
        onSelectSlide={(slideIndex) => {
          editor.setCurrentSlideIndex(slideIndex);
          editor.setSelectedLayerId(null);
        }}
        onToggleLayerVisibility={editor.actions.toggleLayerVisibility}
        onUndo={editor.actions.undo}
        onUpdateLayer={editor.actions.updateLayer}
        onUploadCurrentSlideImage={handleUploadCurrentSlideImage}
        onUploadLayerAsset={handleUploadLayerAsset}
        projectId={projectId}
        projectName={project.name}
        exportLabel={entitlementSummary?.screenshotHdExportEnabled ? "Export PNG" : "Download Preview"}
        planCode={entitlementSummary?.planCode || "free"}
        saveState={saveState}
        selectedDeviceType={selectedDeviceType}
        selectedLayerId={editor.selectedLayerId}
        selectedSlideLayers={editor.currentSlide?.layers || []}
        slideName={editor.currentSlide?.name || `Screen ${editor.currentSlideIndex + 1}`}
        slides={editor.config.slides}
        uploads={uploads}
      />

      <PaywallModal
        open={paywallPlan !== null && entitlementSummary !== null}
        projectId={projectId}
        currentPlan={entitlementSummary?.planCode || "free"}
        targetPlan={paywallPlan || "base"}
        featureName={paywallFeature}
        secondaryActionLabel={paywallSecondaryActionLabel || undefined}
        onSecondaryAction={
          paywallSecondaryActionLabel
            ? () => {
                editor.actions.requestExport();
                setPaywallSecondaryActionLabel(null);
              }
            : undefined
        }
        onClose={() => {
          setPaywallPlan(null);
          setPaywallSecondaryActionLabel(null);
        }}
      />
    </>
  );
}
