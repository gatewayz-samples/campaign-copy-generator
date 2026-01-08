'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Sparkles, Copy, CheckCircle2, Zap, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GeneratedCopy {
  productDescription: string;
  tagline: string;
  socialMediaPost: string;
  emailBlurb: string;
}

interface Model {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

export default function CampaignCopyGenerator() {
  const [productName, setProductName] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [tone, setTone] = useState('professional');
  const [creativityLevel, setCreativityLevel] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Model selection
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [useAutoModel, setUseAutoModel] = useState(true);
  const [selectedModel, setSelectedModel] = useState('');
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');

  const { toast } = useToast();

  // Fetch available models on mount
  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await fetch('/api/models?gateway=openrouter&limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const data = await response.json();

      // Parse the data - it might be a string or already parsed
      let models = [];
      if (typeof data === 'string') {
        models = JSON.parse(data);
      } else if (Array.isArray(data)) {
        models = data;
      } else if (data.data && Array.isArray(data.data)) {
        models = data.data;
      }

      setAvailableModels(models);
    } catch (error) {
      console.error('Error fetching models:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available models. Using default models.',
        variant: 'destructive',
      });

      // Fallback to default models
      setAvailableModels([
        { id: 'openai/gpt-4o', name: 'GPT-4o' },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
        { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
        { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Model selection based on creativity level
  const getAutoModel = () => {
    if (creativityLevel >= 70) {
      return 'openai/gpt-4o'; // High creativity - use GPT-4
    } else if (creativityLevel >= 40) {
      return 'openai/gpt-4o-mini';// Medium creativity
    } else {
      return 'anthropic/claude-3.5-sonnet'; // Low creativity - more structured
    }
  };

  const getCurrentModel = () => {
    return useAutoModel ? getAutoModel() : selectedModel;
  };

  const getTemperature = () => {
    // Map creativity level (0-100) to temperature (0-1.5)
    return (creativityLevel / 100) * 1.5;
  };

  const handleGenerate = async () => {
    if (!productName || !targetAudience || !keyPoints) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (!useAutoModel && !selectedModel) {
      toast({
        title: 'No Model Selected',
        description: 'Please select a model or enable auto-selection.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedCopy(null);

    try {
      const model = getCurrentModel();
      const temperature = getTemperature();

      const systemPrompt = `You are an expert marketing copywriter. Generate marketing copy that maintains a consistent ${tone} voice across all pieces. The creativity level is ${creativityLevel}/100.`;

      const userPrompt = `
Product Name: ${productName}
Target Audience: ${targetAudience}
Key Points: ${keyPoints}
Tone: ${tone}

Generate a complete suite of marketing copy including:
1. Product Description (2-3 paragraphs)
2. Tagline (one catchy line)
3. Social Media Post (engaging, with hashtags)
4. Email Blurb (compelling opening for an email campaign)

Ensure all pieces maintain a consistent ${tone} voice and highlight the key points effectively.
Format your response as JSON with these exact keys: productDescription, tagline, socialMediaPost, emailBlurb
`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate copy');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Try to parse JSON from the response
      let parsedCopy: GeneratedCopy;
      try {
        // Extract JSON if it's wrapped in markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : content;
        parsedCopy = JSON.parse(jsonString);
      } catch (e) {
        // If JSON parsing fails, try to extract sections manually
        parsedCopy = {
          productDescription: extractSection(content, 'Product Description', 'Tagline') || 'Could not parse product description',
          tagline: extractSection(content, 'Tagline', 'Social Media Post') || 'Could not parse tagline',
          socialMediaPost: extractSection(content, 'Social Media Post', 'Email Blurb') || 'Could not parse social media post',
          emailBlurb: extractSection(content, 'Email Blurb', null) || 'Could not parse email blurb',
        };
      }

      setGeneratedCopy(parsedCopy);
      toast({
        title: 'Success!',
        description: `Marketing copy generated using ${model}`,
      });
    } catch (error) {
      console.error('Error generating copy:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate copy. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const extractSection = (content: string, startMarker: string, endMarker: string | null): string => {
    const startRegex = new RegExp(`${startMarker}:?\\s*\\n?`, 'i');
    const startMatch = content.search(startRegex);

    if (startMatch === -1) return '';

    const startIndex = startMatch + content.substring(startMatch).match(startRegex)![0].length;

    if (!endMarker) {
      return content.substring(startIndex).trim();
    }

    const endRegex = new RegExp(`\\n\\s*${endMarker}`, 'i');
    const endMatch = content.substring(startIndex).search(endRegex);

    if (endMatch === -1) {
      return content.substring(startIndex).trim();
    }

    return content.substring(startIndex, startIndex + endMatch).trim();
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: 'Copied!',
        description: 'Content copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const getCreativityLabel = () => {
    if (creativityLevel >= 70) return 'High Creativity - Brainstorming';
    if (creativityLevel >= 40) return 'Medium Creativity - Balanced';
    return 'Low Creativity - Final Copy';
  };

  const getCreativityColor = () => {
    if (creativityLevel >= 70) return 'bg-purple-500';
    if (creativityLevel >= 40) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getModelDisplayName = (modelId: string) => {
    const model = availableModels.find(m => m.id === modelId);
return model?.name || modelId;
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setIsModelModalOpen(false);
    setModelSearchQuery('');
  };

  const filteredModels = availableModels.filter((model) => {
    const searchLower = modelSearchQuery.toLowerCase();
    return (
      model.id.toLowerCase().includes(searchLower) ||
      model.name?.toLowerCase().includes(searchLower) ||
      model.description?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Campaign Copy Generator
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Generate consistent, professional marketing copy across multiple formats using AI
</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Provide information about your product and target audience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  placeholder="e.g., EcoBottle Pro"
value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience *</Label>
                <Input
                  id="targetAudience"
                  placeholder="e.g., Environmentally conscious millennials"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyPoints">Key Points *</Label>
                <Textarea
                  id="keyPoints"
                  placeholder="e.g., Made from recycled materials,keeps drinks cold for 24 hours, dishwasher safe"
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger id="tone">
                    <SelectValue />
</SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    <SelectItem value="luxurious">Luxurious</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="authoritative">Authoritative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
<Label>Creativity Level</Label>
                  <Badge className={getCreativityColor()}>
                    {getCreativityLabel()}
                  </Badge>
                </div>
                <Slider
                  value={[creativityLevel]}
                  onValueChange={(value) => setCreativityLevel(value[0])}
                  min={0}
                  max={100}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Structured</span>
                  <span>Creative</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {creativityLevel < 40&& 'Best for final, polished copy with consistent structure'}
                  {creativityLevel >= 40 && creativityLevel < 70 && 'Balanced creativity and structure'}
                  {creativityLevel >= 70 && 'Best for brainstorming and exploring creative angles'}
                </p>
              </div>

              {/* Model Selection Section */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-model" className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Auto-Select Model
                    </Label>
                    <p className="text-xs text-slate-500">
                      Automatically choose the best model based on creativity level
                    </p>
                  </div>
                  <Switch
                    id="auto-model"
                    checked={useAutoModel}
                    onCheckedChange={setUseAutoModel}
                  />
                </div>

{!useAutoModel && (
                  <div className="space-y-2">
                    <Label>Select Model</Label>
                    <Dialog open={isModelModalOpen} onOpenChange={setIsModelModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          {selectedModel ? getModelDisplayName(selectedModel) : 'Choose a model...'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Select AI Model</DialogTitle>
                          <DialogDescription>
                            Choose from {availableModels.length}+ available models
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          {/* Search Input */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              placeholder="Search models..."
                              value={modelSearchQuery}
                              onChange={(e) => setModelSearchQuery(e.target.value)}
                              className="pl-10"
                            />
                          </div>

                          {/* Models List */}
                          {isLoadingModels ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                            </div>
                          ) : (
                            <ScrollArea className="h-[400px] pr-4">
<div className="space-y-2">
                                {filteredModels.length === 0 ? (
                                  <p className="text-center text-slate-500 py-8">
                                    No models found matching your search.
                                  </p>
                                ) : (
                                  filteredModels.map((model) => (
                                    <button
                                      key={model.id}
                                      onClick={() => handleModelSelect(model.id)}
                                      className={`w-full text-left p-4 rounded-lg border transition-all hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 ${
                                        selectedModel === model.id
                                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                                          : 'border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                          <h3 className="font-medium text-sm">
                                            {model.name || model.id}
                                          </h3>
                                          <p className="text-xs text-slate-500 mt-1">
                                            {model.id}
                                          </p>
                                          {model.description && (
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                                              {model.description}
                                            </p>
)}
                                          {model.context_length && (
                                            <div className="flex items-center gap-2 mt-2">
                                              <Badge variant="secondary" className="text-xs">
                                                {model.context_length.toLocaleString()} tokens
                                              </Badge>
                                            </div>
                                          )}
                                        </div>
                                        {selectedModel === model.id && (
                                          <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0" />
                                        )}
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                            </ScrollArea>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
                  <p className="text-xs font-medium text-purple-900 dark:text-purple-300 flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    Using: {getModelDisplayName(getCurrentModel())}
                  </p>
                  {useAutoModel && (
                    <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                      {creativityLevel >= 70 && 'GPT-4o for maximum creativity'}
                      {creativityLevel >= 40 && creativityLevel < 70 && 'GPT-4o Mini for balanced performance'}
                      {creativityLevel < 40 && 'Claude 3.5 Sonnet for structured output'}
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Marketing Copy
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Generated Copy</CardTitle>
              <CardDescription>
                Your AI-generated marketing materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!generatedCopy && !isGenerating && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Sparkles className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    Fill in the campaign details and click generate to see your marketing copy
                  </p>
                </div>
              )}

              {isGenerating && (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="h-16 w-16 text-purple-600 animate-spin mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">
                    Generating your marketing copy...
                  </p>
                </div>
              )}

              {generatedCopy&& (
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="tagline">Tagline</TabsTrigger>
                    <TabsTrigger value="social">Social</TabsTrigger>
<TabsTrigger value="email">Email</TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Product Description</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedCopy.productDescription, 'description')}
                      >
                        {copiedField === 'description' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">{generatedCopy.productDescription}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="tagline" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Tagline</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedCopy.tagline, 'tagline')}
                      >
{copiedField === 'tagline' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {generatedCopy.tagline}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="social" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Social Media Post</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedCopy.socialMediaPost, 'social')}
                      >
                        {copiedField === 'social' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">{generatedCopy.socialMediaPost}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="email" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Email Blurb</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedCopy.emailBlurb, 'email')}
                      >
                        {copiedField === 'email' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
</Button>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">{generatedCopy.emailBlurb}</p>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Multi-Model Routing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Automatically routes to the best model based on creativity level, or manually choose from 100+ available models.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Consistent Voice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Maintains your selected tone across all marketing materials for brand consistency.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Multiple Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
Generate product descriptions, taglines, social posts, and email content all at once.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
