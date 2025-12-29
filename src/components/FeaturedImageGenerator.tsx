import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Image, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

const FeaturedImageGenerator = () => {
  const [categoryText, setCategoryText] = useState("HEALTH AND WELLNESS");
  const [mainText, setMainText] = useState("How to Have a Better Work-Life Balance");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bannerColor, setBannerColor] = useState("#ffffff");
  const [bannerOpacity, setBannerOpacity] = useState(0.85);
  const [categoryColor, setCategoryColor] = useState("#c67c4e");
  const [titleColor, setTitleColor] = useState("#1a1a1a");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBgUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBgImage(event.target?.result as string);
        toast.success("Background image uploaded!");
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const generateImage = useCallback(async () => {
    if (!mainText.trim()) {
      toast.error("Please enter a main title");
      return;
    }

    setIsGenerating(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas dimensions (standard blog featured image size)
      canvas.width = 1200;
      canvas.height = 630;

      // Draw background image or gradient
      if (bgImage) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            resolve();
          };
          img.onerror = reject;
          img.src = bgImage;
        });
      } else {
        // Fallback gradient if no background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, "#e8e4df");
        gradient.addColorStop(1, "#d4cfc9");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Calculate banner dimensions
      const bannerHeight = 340;
      const bannerY = (canvas.height - bannerHeight) / 2;
      const bannerPadding = 100;

      // Draw semi-transparent white banner overlay
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
      };
      
      const bannerRgb = hexToRgb(bannerColor);
      ctx.fillStyle = `rgba(${bannerRgb.r}, ${bannerRgb.g}, ${bannerRgb.b}, ${bannerOpacity})`;
      ctx.fillRect(bannerPadding, bannerY, canvas.width - bannerPadding * 2, bannerHeight);

      // Draw category text (smaller, uppercase, accent color)
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `500 24px "Inter", system-ui, sans-serif`;
      ctx.letterSpacing = "8px";
      ctx.fillStyle = categoryColor;
      const categoryY = bannerY + 70;
      ctx.fillText(categoryText.toUpperCase(), canvas.width / 2, categoryY);

      // Draw main title (larger, serif-style)
      ctx.font = `400 64px Georgia, "Times New Roman", serif`;
      ctx.fillStyle = titleColor;

      // Word wrap for main title
      const maxWidth = canvas.width - bannerPadding * 2 - 80;
      const words = mainText.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      // Draw title lines
      const lineHeight = 80;
      const titleStartY = categoryY + 80;
      lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, titleStartY + index * lineHeight);
      });

      // Convert to image
      const imageUrl = canvas.toDataURL("image/png");
      setGeneratedImage(imageUrl);
      toast.success("Image generated successfully!");
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  }, [mainText, categoryText, bgImage, bannerColor, bannerOpacity, categoryColor, titleColor]);

  const downloadImage = useCallback(() => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.download = `featured-image-${Date.now()}.png`;
    link.href = generatedImage;
    link.click();
    toast.success("Image downloaded!");
  }, [generatedImage]);

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Featured Image Generator
          </h1>
          <p className="text-lg text-muted-foreground">
            Create stunning blog featured images with custom text overlays
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Input Text
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Text Input */}
              <div className="space-y-2">
                <Label>Category / Subtitle</Label>
                <Textarea
                  placeholder="Enter category text (e.g., HEALTH AND WELLNESS)"
                  value={categoryText}
                  onChange={(e) => setCategoryText(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
              </div>

              {/* Main Title Input */}
              <div className="space-y-2">
                <Label>Main Title</Label>
                <Textarea
                  placeholder="Enter your main blog title..."
                  value={mainText}
                  onChange={(e) => setMainText(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>

              {/* Background Image Upload */}
              <div className="space-y-2">
                <Label>Background Image</Label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleBgUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {bgImage ? "Change Image" : "Upload Image"}
                  </Button>
                  {bgImage && (
                    <Button variant="ghost" onClick={() => setBgImage(null)}>
                      Clear
                    </Button>
                  )}
                </div>
                {bgImage && (
                  <img src={bgImage} alt="Background preview" className="w-full h-20 object-cover rounded-md" />
                )}
              </div>

              {/* Color Settings */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Colors</Label>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Banner Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={bannerColor}
                        onChange={(e) => setBannerColor(e.target.value)}
                        className="w-10 h-8 p-0 border-0 cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground">{bannerColor}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Banner Opacity</Label>
                    <Input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={bannerOpacity}
                      onChange={(e) => setBannerOpacity(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Category Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={categoryColor}
                        onChange={(e) => setCategoryColor(e.target.value)}
                        className="w-10 h-8 p-0 border-0 cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground">{categoryColor}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Title Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={titleColor}
                        onChange={(e) => setTitleColor(e.target.value)}
                        className="w-10 h-8 p-0 border-0 cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground">{titleColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={generateImage}
                disabled={isGenerating || !mainText.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Image"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Preview</span>
                {generatedImage && (
                  <Button size="sm" variant="outline" onClick={downloadImage}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated featured image"
                  className="w-full rounded-lg border border-border shadow-lg"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
                  <p className="text-sm text-muted-foreground">
                    Your image will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Hidden canvas for image generation */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default FeaturedImageGenerator;
