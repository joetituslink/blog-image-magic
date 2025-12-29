import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Image, Loader2 } from "lucide-react";
import { toast } from "sonner";

const FeaturedImageGenerator = () => {
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#1a1a2e");
      gradient.addColorStop(0.5, "#16213e");
      gradient.addColorStop(1, "#0f3460");
      ctx.fillStyle = gradient;
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

      // Add decorative elements
      ctx.strokeStyle = "rgba(99, 102, 241, 0.3)";
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
      ctx.fillStyle = "#ffffff";
      lines.forEach((line) => {
        ctx.fillText(line, canvas.width / 2, y);
        y += lineHeight;
      });

      // Add accent glow
      ctx.shadowColor = "rgba(99, 102, 241, 0.5)";
      ctx.shadowBlur = 30;
      ctx.strokeStyle = "rgba(99, 102, 241, 0.6)";
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
  }, [text]);

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
                className="min-h-[150px] resize-none"
              />
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
