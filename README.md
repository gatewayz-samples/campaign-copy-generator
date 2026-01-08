# Campaign Copy Generator

An AI-powered marketing copy generation tool that creates consistent, professional content across multiple formats. Built with Next.js and powered by the Gatewayz API.

## Features

### 🎯 Multi-Format Generation
Generate a complete suite of marketing materials in one go:
- **Product Descriptions** - Detailed 2-3 paragraph descriptions
- **Taglines** - Catchy, memorable one-liners
- **Social Media Posts** - Engaging content with hashtags
- **Email Blurbs** - Compelling email campaign openers

### 🎨 Creativity Level Control
Toggle between different creativity levels to match your needs:
- **Low (0-39%)** - Structured, final copy using Claude 3.5 Sonnet
- **Medium (40-69%)** - Balanced creativity using GPT-4o Mini
- **High (70-100%)** - Creative brainstorming using GPT-4o

### 🎭 Tone Customization
Choose from multiple tones to match your brand voice:
- Professional
- Casual
- Enthusiastic
- Luxurious
- Friendly
- Authoritative

### 🔄 Multi-Model Routing
Automatically routes to the best AI model based on your creativity level, showcasing the Gatewayz API's one-API-multiple-model benefit:
- High creativity → GPT-4o (best for brainstorming)
- Medium creativity → GPT-4o Mini (balanced performance)
- Low creativity → Claude 3.5 Sonnet (structured, consistent output)

## Setup Instructions

### 1. Install Dependencies
```bash
bun install
```

### 2. Configure Environment Variables
Update the `.env` file with your Gatewayz API key:

```env
GATEWAYZ_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_API_BASE_URL=https://api.gatewayz.ai
```

To get your API key:
1. Sign up at [Gatewayz](https://gatewayz.ai)
2. Navigate to your dashboard
3. Generate an API key
4. Copy it to the `.env` file

### 3. Run the Development Server
```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. **Enter Product Details**
   - Product Name: Name of your product/service
   - Target Audience: Who you're marketing to
   - Key Points: Main features, benefits, or selling points
   - Tone: Select the voice/tone for your copy

2. **Adjust Creativity Level**
   - Use the slider to control how creative vs. structured you want the output
   - Lower values = more consistent, polished final copy
   - Higher values = more creative, exploratory brainstorming

3. **Generate Copy**
   - Click "Generate Marketing Copy"
   - Wait for the AI to create your content (typically 5-15 seconds)
   - Review the generated copy in the tabs

4. **Copy & Use**
   - Click the copy button on any section to copy to clipboard
   - Use the content in your marketing campaigns

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Components**: Radix UI + Tailwind CSS
- **AI API**: Gatewayz API
- **Styling**: Tailwind CSS

## API Endpoints

### `/api/chat` (POST)
Handles chat completions using the Gatewayz API.

**Request Body:**
```json
{
  "model": "openai/gpt-4o",
  "messages": [
    { "role": "system", "content": "System prompt" },
    { "role": "user", "content": "User prompt" }
  ],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

### `/api/models` (GET)
Fetches available models from the Gatewayz API.

**Query Parameters:**
- `gateway`: Gateway to use (default: "openrouter")
- `limit`: Number of models to return (default: 50)

## Showcase Features

This app demonstrates the key advantages of the Gatewayz API:

1. **One API, Multiple Models** - Seamlessly switch between GPT-4, GPT-4o Mini, and Claude without changing your code
2. **Consistent Interface** - Same API structure works across all providers
3. **Smart Routing** - Choose the best model for each use case (creativity vs. structure)
4. **Cost Optimization** - Use expensive models only when needed (high creativity), cheaper models for standard tasks

## Example Use Cases

### E-commerce Product Launch
- Product: "EcoBottle Pro"
- Audience: "Environmentally conscious millennials"
- Key Points: "Made from recycled materials, keeps drinks cold for 24 hours, dishwasher safe"
- Tone: Enthusiastic
- Creativity: Medium (for balanced, engaging copy)

### B2B SaaS Marketing
- Product: "CloudSync Enterprise"
- Audience: "IT managers at mid-size companies"
- Key Points: "Real-time synchronization, enterprise-grade security, 99.9% uptime"
- Tone: Professional
- Creativity: Low (for precise, authoritative copy)

### Creative Campaign Ideation
- Product: "Summer Fashion Collection"
- Audience: "Fashion-forward young adults"
- Key Points: "Bold colors, sustainable fabrics, limited edition"
- Tone: Casual
- Creativity: High (for innovative, attention-grabbing ideas)

## Development

### Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts          # Chat completions endpoint
│   │   └── models/
│   │       └── route.ts          # Models listing endpoint
│   ├── layout.tsx                # Root layout with metadata
│   └── page.tsx                  # Main campaign generator page
├── components/
│   └── ui/                       # Reusable UI components
└── lib/
    └── utils.ts                  # Utility functions
```

### Environment Variables
- `GATEWAYZ_API_KEY` - Your Gatewayz API key (required)
- `NEXT_PUBLIC_API_BASE_URL` - Base URL for Gatewayz API (default: https://api.gatewayz.ai)

## License

MIT

## Support

For issues or questions:
- Gatewayz API: [Documentation](https://gatewayz.ai/docs)
- Next.js: [Documentation](https://nextjs.org/docs)

---

Built with ❤️ using Next.js and Gatewayz API
# campaign-copy-generator
