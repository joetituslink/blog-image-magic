import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Image, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

const FeaturedImageGenerator = () => {
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#1a1a2e");
  const [secondaryColor, setSecondaryColor] = useState("#0f3460");
  const [overlayColor, setOverlayColor] = useState("#000000");
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [textColor, setTextColor] = useState("#ffffff");
  const [accentColor, setAccentColor] = useState("#6366f1");
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
    if (!text.trim()) {
      toast.error("Please enter some text");
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
            // Cover the canvas with the image
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
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(0.5, secondaryColor);
        gradient.addColorStop(1, primaryColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // First overlay - solid color
      ctx.fillStyle = `${overlayColor}${Math.round(overlayOpacity * 255).toString(16).padStart(2, '0')}`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Second overlay - gradient for depth
      const overlayGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      overlayGradient.addColorStop(0, "rgba(0, 0, 0, 0.2)");
      overlayGradient.addColorStop(0.5, "rgba(0, 0, 0, 0)");
      overlayGradient.addColorStop(1, "rgba(0, 0, 0, 0.3)");
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add subtle pattern overlay
      ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
      for (let i = 0; i < canvas.width; i += 30) {
        for (let j = 0; j < canvas.height; j += 30) {
          if ((i + j) % 60 === 0) {
            ctx.beginPath();
            ctx.arc(i, j, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Add decorative elements with accent color
      ctx.strokeStyle = `${accentColor}4D`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, 50);
      ctx.lineTo(150, 50);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(canvas.width - 150, canvas.height - 50);
      ctx.lineTo(canvas.width - 50, canvas.height - 50);
      ctx.stroke();

      // Configure text
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Calculate font size based on text length
      let fontSize = 72;
      if (text.length > 50) fontSize = 56;
      if (text.length > 100) fontSize = 44;
      if (text.length > 150) fontSize = 36;

      ctx.font = `bold ${fontSize}px "Inter", system-ui, sans-serif`;

      // Word wrap text
      const maxWidth = canvas.width - 160;
      const words = text.split(" ");
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

      // Calculate vertical position
      const lineHeight = fontSize * 1.3;
      const totalHeight = lines.length * lineHeight;
      let y = (canvas.height - totalHeight) / 2 + lineHeight / 2;

      // Draw text shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      lines.forEach((line) => {
        ctx.fillText(line, canvas.width / 2 + 3, y + 3);
        y += lineHeight;
      });

      // Draw main text
      y = (canvas.height - totalHeight) / 2 + lineHeight / 2;
      ctx.fillStyle = textColor;
      lines.forEach((line) => {
        ctx.fillText(line, canvas.width / 2, y);
        y += lineHeight;
      });

      // Add accent glow
      ctx.shadowColor = `${accentColor}80`;
      ctx.shadowBlur = 30;
      ctx.strokeStyle = `${accentColor}99`;
      ctx.lineWidth = 1;
      y = (canvas.height - totalHeight) / 2 + lineHeight / 2;
      lines.forEach((line) => {
        ctx.strokeText(line, canvas.width / 2, y);
        y += lineHeight;
      });
      ctx.shadowBlur = 0;

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
  }, [text, bgImage, primaryColor, secondaryColor, overlayColor, overlayOpacity, textColor, accentColor]);

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
              <Textarea
                placeholder="Enter your blog title or headline..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[100px] resize-none"
              />

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
                    <Label className="text-xs text-muted-foreground">Primary BG</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-8 p-0 border-0 cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground">{primaryColor}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Secondary BG</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-10 h-8 p-0 border-0 cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground">{secondaryColor}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Overlay Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={overlayColor}
                        onChange={(e) => setOverlayColor(e.target.value)}
                        className="w-10 h-8 p-0 border-0 cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground">{overlayColor}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Overlay Opacity</Label>
                    <Input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={overlayOpacity}
                      onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Text Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-10 h-8 p-0 border-0 cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground">{textColor}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Accent Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-10 h-8 p-0 border-0 cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground">{accentColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={generateImage}
                disabled={isGenerating || !text.trim()}
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
