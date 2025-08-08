/// <reference types="@figma/plugin-typings" />

// This runs in the Figma plugin sandbox
figma.showUI(__html__, { 
  width: 400, 
  height: 700,
  themeColors: true 
});

interface ComponentData {
  name: string;
  type: string;
  width: number;
  height: number;
  fills?: readonly Paint[] | null;
  strokes?: readonly Paint[] | null;
  effects?: readonly Effect[] | null;
  cornerRadius?: number | null;
  children: ComponentData[];
  constraints?: Constraints;
  layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL" | "GRID";
  itemSpacing?: number | null;
  paddingTop?: number | null;
  paddingRight?: number | null;
  paddingBottom?: number | null;
  paddingLeft?: number | null;
  characters?: string;
  fontSize?: number | null;
  fontName?: FontName | null;
  textAlignHorizontal?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  textAlignVertical?: "TOP" | "CENTER" | "BOTTOM";
  x?: number;
  y?: number;
  visible?: boolean;
  opacity?: number;
  blendMode?: string;
  rotation?: number;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  lineHeight?: LineHeight | null;
  letterSpacing?: LetterSpacing | null;
  textDecoration?: TextDecoration | null;
  textCase?: TextCase | null;
}

// Helper function to safely extract fills
function extractFills(fills: readonly Paint[] | PluginAPI['mixed']): readonly Paint[] | null {
  return fills === figma.mixed || typeof fills === 'symbol' ? null : fills;
}

// Helper function to safely extract numeric values
function extractNumber(value: number | PluginAPI['mixed']): number | null {
  return value === figma.mixed || typeof value === 'symbol' ? null : value;
}

// Helper function to safely extract layout mode
function extractLayoutMode(layoutMode: "NONE" | "HORIZONTAL" | "VERTICAL" | "GRID"): "NONE" | "HORIZONTAL" | "VERTICAL" | "GRID" {
  return layoutMode || "NONE";
}

// Helper function to safely convert any value to string, handling mixed values
function safeStringify(value: any): string {
  if (value === figma.mixed || typeof value === 'symbol') {
    return "mixed";
  }
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return "[object]";
    }
  }
  return String(value);
}

// Function to create indentation string
function createIndent(depth: number): string {
  var result = "";
  for (var i = 0; i < depth; i++) {
    result += "  ";
  }
  return result;
}

// Helper function to make API calls using Figma's fetch with CORS support
async function callClaudeAPI(apiKey: string, prompt: string): Promise<string> {
  console.log('🔄 Making API call to Claude...');
  
  const requestBody = {
    model: 'claude-opus-4-1-20250805',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: prompt
    }]
  };

  try {
    console.log('📡 Making API request to Anthropic...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📊 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful');
      return data.content[0].text;
    } else {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`API Error: ${response.status} - Please check your API key`);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
    throw new Error(`Failed to connect to Claude API: ${(error as Error).message}`);
  }
}

// Helper function to test API key using Claude Haiku specifically
async function testClaudeAPI(apiKey: string): Promise<void> {
  console.log('🧪 Testing API key with Claude Haiku...');
  
  // Debug API key format
  console.log('🔑 API key length:', apiKey.length);
  console.log('🔑 API key starts with:', apiKey.substring(0, 15) + '...');
  console.log('🔑 API key contains non-ASCII:', /[^\x00-\x7F]/.test(apiKey));
  
  const requestBody = {
    model: 'claude-3-haiku-20240307', // Using Haiku specifically for testing
    max_tokens: 10,
    messages: [{
      role: 'user',
      content: 'Hello'
    }]
  };

  try {
    console.log('🔍 Testing API connection with Claude Haiku...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('🔍 Test response status:', response.status);

    if (response.ok) {
      console.log('✅ API key test successful with Claude Haiku');
      return;
    } else {
      const errorText = await response.text();
      console.error('❌ API key test failed:', errorText);
      throw new Error(`Invalid API key (Status: ${response.status})`);
    }
  } catch (error) {
    console.error('❌ API test error:', error);
    throw new Error(`API key test failed: ${(error as Error).message}`);
  }
}

function createPrompt(componentData: ComponentData, outputFormat: string): string {
  const componentJson = JSON.stringify(componentData, null, 2);
  
  if (outputFormat === 'html') {
    return `Convert the following Figma component into a complete, production-ready HTML file with inline CSS. Follow these requirements:

Component Data:
${componentJson}

Strict Requirements:
1. Generate COMPLETE HTML file with <!DOCTYPE>, <html>, <head>, and <body> tags
2. Use semantic HTML5 elements (header, nav, main, section, etc.) where appropriate
3. All styling must be inline CSS (no separate stylesheets)
4. Preserve exact layout, spacing, colors, and typography from Figma
5. Include all text content exactly as shown in the design
6. Use proper CSS units (px, rem, %) matching Figma values
7. Implement responsive design using relative units where appropriate
8. Structure the HTML to match the component hierarchy
9. Include proper accessibility attributes (alt text, aria-labels)
10. Format the code with proper indentation

Output Rules:
- MUST include complete HTML document structure
- MUST NOT include any explanations or markdown
- MUST preserve all visual properties from Figma
- MUST output only the HTML code

Example Output:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component</title>
</head>
<body>
  <div style="...">
    <!-- All nested elements -->
  </div>
</body>
</html>`;

  } else { // react
    return `Convert the following Figma component into a complete React functional component with TypeScript. Follow these requirements:

Component Data:
${componentJson}

Strict Requirements:
1. Generate COMPLETE React component with all necessary imports
2. Use TypeScript type definitions for props and state
3. All styling must be inline (style prop) using React CSSProperties
4. Preserve exact layout, spacing, colors, and typography from Figma
5. Include all text content exactly as shown in the design
6. Convert Figma properties to appropriate CSS properties
7. Structure the component hierarchy to match Figma exactly
8. Use proper JSX syntax with React.Fragment where needed
9. Include proper accessibility attributes
10. Format the code with proper TypeScript typing and indentation

Output Rules:
- MUST include 'import React from "react";' at minimum
- MUST use TypeScript typing for styles and props
- MUST NOT include any explanations or markdown
- MUST preserve all visual properties from Figma
- MUST output only the component code

Example Output:
import React from 'react';

interface ComponentProps {
  // Add props if needed
}

const ComponentName: React.FC<ComponentProps> = () => {
  return (
    <div style={{...}}>
      {/* All nested elements */}
    </div>
  );
};

export default ComponentName;`;
  }
}

// Function to log all attributes of a node with hierarchy indentation
function logNodeAttributes(node: SceneNode | ComponentNode | InstanceNode, depth: number = 0): void {
  var indent = createIndent(depth);
  var prefix = indent + "├─ ";
  
  console.log(prefix + "=== " + node.name + " (" + node.type + ") ===");
  
  // Log basic properties
  console.log(prefix + "• name: " + node.name);
  console.log(prefix + "• type: " + node.type);
  console.log(prefix + "• width: " + node.width);
  console.log(prefix + "• height: " + node.height);
  
  // Only log x and y for child elements (not the parent component)
  if (depth > 0) {
    console.log(prefix + "• x: " + node.x);
    console.log(prefix + "• y: " + node.y);
  }
  
  console.log(prefix + "• visible: " + node.visible);
  console.log(prefix + "• id: " + node.id);
  
  // Log constraints if available
  if ('constraints' in node) {
    console.log(prefix + "• constraints: " + safeStringify(node.constraints));
  }
  
  // Log fills if available
  if ('fills' in node) {
    var fills = extractFills(node.fills);
    console.log(prefix + "• fills: " + safeStringify(fills));
  }
  
  // Log strokes if available
  if ('strokes' in node) {
    var strokes = extractFills(node.strokes);
    console.log(prefix + "• strokes: " + safeStringify(strokes));
  }
  
  // Log effects if available
  if ('effects' in node) {
    console.log(prefix + "• effects: " + safeStringify(node.effects));
  }
  
  // Log corner radius if available
  if ('cornerRadius' in node) {
    console.log(prefix + "• cornerRadius: " + extractNumber((node as any).cornerRadius));
  }
  
  // Log layout properties for frames/auto-layout
  if ('layoutMode' in node) {
    console.log(prefix + "• layoutMode: " + (node as any).layoutMode);
  }
  if ('itemSpacing' in node) {
    console.log(prefix + "• itemSpacing: " + extractNumber((node as any).itemSpacing));
  }
  if ('paddingTop' in node) {
    console.log(prefix + "• paddingTop: " + extractNumber((node as any).paddingTop));
  }
  if ('paddingRight' in node) {
    console.log(prefix + "• paddingRight: " + extractNumber((node as any).paddingRight));
  }
  if ('paddingBottom' in node) {
    console.log(prefix + "• paddingBottom: " + extractNumber((node as any).paddingBottom));
  }
  if ('paddingLeft' in node) {
    console.log(prefix + "• paddingLeft: " + extractNumber((node as any).paddingLeft));
  }
  if ('primaryAxisAlignItems' in node) {
    console.log(prefix + "• primaryAxisAlignItems: " + (node as any).primaryAxisAlignItems);
  }
  if ('counterAxisAlignItems' in node) {
    console.log(prefix + "• counterAxisAlignItems: " + (node as any).counterAxisAlignItems);
  }
  
  // Log text-specific properties
  if (node.type === 'TEXT') {
    var textNode = node as TextNode;
    console.log(prefix + "• characters: '" + textNode.characters + "'");
    console.log(prefix + "• fontSize: " + extractNumber(textNode.fontSize));
    
    var fontNameStr = safeStringify(textNode.fontName === figma.mixed ? null : textNode.fontName);
    console.log(prefix + "• fontName: " + fontNameStr);
    
    console.log(prefix + "• textAlignHorizontal: " + textNode.textAlignHorizontal);
    console.log(prefix + "• textAlignVertical: " + textNode.textAlignVertical);
    
    var lineHeightStr = safeStringify(textNode.lineHeight === figma.mixed ? null : textNode.lineHeight);
    console.log(prefix + "• lineHeight: " + lineHeightStr);
    
    var letterSpacingStr = safeStringify(textNode.letterSpacing === figma.mixed ? null : textNode.letterSpacing);
    console.log(prefix + "• letterSpacing: " + letterSpacingStr);
    
    console.log(`${prefix}• textDecoration: ${textNode.textDecoration?.toString() ?? 'none'}`);
    console.log(`${prefix}• textCase: ${textNode.textCase?.toString() ?? 'none'}`);
  }
  
  // Log opacity
  if ('opacity' in node) {
    console.log(prefix + "• opacity: " + safeStringify(node.opacity));
  }
  
  // Log blend mode
  if ('blendMode' in node) {
    console.log(prefix + "• blendMode: " + safeStringify(node.blendMode));
  }
  
  // Log rotation
  if ('rotation' in node) {
    console.log(prefix + "• rotation: " + safeStringify(node.rotation));
  }
  
  // Log component/instance specific properties
  if (node.type === 'COMPONENT') {
    console.log(prefix + "• description: " + (node as ComponentNode).description);
  }
  
  if (node.type === 'INSTANCE') {
    var instanceNode = node as InstanceNode;
    console.log(prefix + "• mainComponent: " + (instanceNode.mainComponent ? instanceNode.mainComponent.name : "null"));
  }
  
  console.log(prefix + "─────────────────────────");
  
  // Recursively log children
  if ('children' in node) {
    var children = (node as any).children;
    if (children && children.length > 0) {
      console.log(indent + "└─ Children (" + children.length + "):");
      for (var i = 0; i < children.length; i++) {
        logNodeAttributes(children[i], depth + 1);
      }
    }
  }
}

// Function to extract all attributes of a node into an object
function extractAllAttributes(node: SceneNode | ComponentNode | InstanceNode, depth: number = 0): any {
  var attributes: any = {
    name: node.name,
    type: node.type,
    width: node.width,
    height: node.height,
    visible: node.visible,
    id: node.id
  };

  // Only include x and y for child elements (not the parent component)
  if (depth > 0) {
    attributes.x = node.x;
    attributes.y = node.y;
  }

  // Add constraints if available
  if ('constraints' in node) {
    attributes.constraints = node.constraints;
  }

  // Add fills if available
  if ('fills' in node) {
    var fills = extractFills(node.fills);
    if (fills) attributes.fills = fills;
  }

  // Add strokes if available
  if ('strokes' in node) {
    var strokes = extractFills(node.strokes);
    if (strokes) attributes.strokes = strokes;
  }

  // Add effects if available
  if ('effects' in node && node.effects && node.effects.length > 0) {
    attributes.effects = node.effects;
  }

  // Add corner radius if available
  if ('cornerRadius' in node) {
    var cornerRadius = extractNumber((node as any).cornerRadius);
    if (cornerRadius !== null) attributes.cornerRadius = cornerRadius;
  }

  // Add layout properties for frames/auto-layout
  if ('layoutMode' in node) {
    attributes.layoutMode = (node as any).layoutMode;
  }
  if ('itemSpacing' in node) {
    var itemSpacing = extractNumber((node as any).itemSpacing);
    if (itemSpacing !== null) attributes.itemSpacing = itemSpacing;
  }
  if ('paddingTop' in node) {
    var paddingTop = extractNumber((node as any).paddingTop);
    if (paddingTop !== null) attributes.paddingTop = paddingTop;
  }
  if ('paddingRight' in node) {
    var paddingRight = extractNumber((node as any).paddingRight);
    if (paddingRight !== null) attributes.paddingRight = paddingRight;
  }
  if ('paddingBottom' in node) {
    var paddingBottom = extractNumber((node as any).paddingBottom);
    if (paddingBottom !== null) attributes.paddingBottom = paddingBottom;
  }
  if ('paddingLeft' in node) {
    var paddingLeft = extractNumber((node as any).paddingLeft);
    if (paddingLeft !== null) attributes.paddingLeft = paddingLeft;
  }
  if ('primaryAxisAlignItems' in node) {
    attributes.primaryAxisAlignItems = (node as any).primaryAxisAlignItems;
  }
  if ('counterAxisAlignItems' in node) {
    attributes.counterAxisAlignItems = (node as any).counterAxisAlignItems;
  }

  // Add text-specific properties
  if (node.type === 'TEXT') {
    var textNode = node as TextNode;
    attributes.characters = textNode.characters;
    
    var fontSize = extractNumber(textNode.fontSize);
    if (fontSize !== null) attributes.fontSize = fontSize;
    
    if (textNode.fontName !== figma.mixed) {
      attributes.fontName = textNode.fontName;
    }
    
    attributes.textAlignHorizontal = textNode.textAlignHorizontal;
    attributes.textAlignVertical = textNode.textAlignVertical;
    
    if (textNode.lineHeight !== figma.mixed) {
      attributes.lineHeight = textNode.lineHeight;
    }
    
    if (textNode.letterSpacing !== figma.mixed) {
      attributes.letterSpacing = textNode.letterSpacing;
    }
    
    if (textNode.textDecoration !== figma.mixed && textNode.textDecoration && textNode.textDecoration !== 'NONE') {
      attributes.textDecoration = textNode.textDecoration;
    }
    
    if (textNode.textCase !== figma.mixed && textNode.textCase && textNode.textCase !== 'ORIGINAL') {
      attributes.textCase = textNode.textCase;
    }
  }

  // Add opacity if not default
  if ('opacity' in node && node.opacity !== 1) {
    attributes.opacity = node.opacity;
  }

  // Add blend mode if not normal
  if ('blendMode' in node && node.blendMode !== 'NORMAL') {
    attributes.blendMode = node.blendMode;
  }

  // Add rotation if not zero
  if ('rotation' in node && node.rotation !== 0) {
    attributes.rotation = node.rotation;
  }

  // Add component/instance specific properties
  if (node.type === 'COMPONENT') {
    var componentNode = node as ComponentNode;
    if (componentNode.description) {
      attributes.description = componentNode.description;
    }
  }

  if (node.type === 'INSTANCE') {
    var instanceNode = node as InstanceNode;
    if (instanceNode.mainComponent) {
      attributes.mainComponent = instanceNode.mainComponent.name;
    }
  }

  // Add children if available
  if ('children' in node) {
    var children = (node as any).children;
    if (children && children.length > 0) {
      attributes.children = children.map(function(child: SceneNode) {
        return extractAllAttributes(child, depth + 1);
      });
    }
  }

  return attributes;
}

// Function to create the hierarchical JSON structure
function createComponentJSON(node: ComponentNode): any {
  var componentJSON: any = {};
  componentJSON[node.name] = extractAllAttributes(node, 0);
  return componentJSON;
}

function extractComponentData(selectedNode: ComponentNode | InstanceNode): ComponentData {
  var data: ComponentData = {
    name: selectedNode.name,
    type: selectedNode.type,
    width: selectedNode.width,
    height: selectedNode.height,
    fills: extractFills(selectedNode.fills),
    strokes: extractFills(selectedNode.strokes),
    effects: selectedNode.effects,
    cornerRadius: 'cornerRadius' in selectedNode ? extractNumber(selectedNode.cornerRadius as any) : null,
    children: [],
    constraints: selectedNode.constraints,
    layoutMode: 'layoutMode' in selectedNode ? extractLayoutMode((selectedNode as any).layoutMode) : "NONE",
    itemSpacing: 'itemSpacing' in selectedNode ? extractNumber((selectedNode as any).itemSpacing) : null,
    paddingTop: 'paddingTop' in selectedNode ? extractNumber((selectedNode as any).paddingTop) : null,
    paddingRight: 'paddingRight' in selectedNode ? extractNumber((selectedNode as any).paddingRight) : null,
    paddingBottom: 'paddingBottom' in selectedNode ? extractNumber((selectedNode as any).paddingBottom) : null,
    paddingLeft: 'paddingLeft' in selectedNode ? extractNumber((selectedNode as any).paddingLeft) : null,
    opacity: 'opacity' in selectedNode ? selectedNode.opacity : undefined,
    blendMode: 'blendMode' in selectedNode ? selectedNode.blendMode : undefined,
    rotation: 'rotation' in selectedNode ? selectedNode.rotation : undefined,
    primaryAxisAlignItems: 'primaryAxisAlignItems' in selectedNode ? (selectedNode as any).primaryAxisAlignItems : undefined,
    counterAxisAlignItems: 'counterAxisAlignItems' in selectedNode ? (selectedNode as any).counterAxisAlignItems : undefined,
  };

  if ('children' in selectedNode) {
    data.children = (selectedNode as any).children.map(function(child: SceneNode) {
      return extractNodeData(child);
    });
  }

  return data;
}

function extractNodeData(node: SceneNode): ComponentData {
  var baseData: ComponentData = {
    name: node.name,
    type: node.type,
    width: node.width,
    height: node.height,
    x: node.x,
    y: node.y,
    visible: node.visible,
    children: [],
    opacity: 'opacity' in node ? node.opacity : undefined,
    blendMode: 'blendMode' in node ? node.blendMode : undefined,
    rotation: 'rotation' in node ? node.rotation : undefined,
  };

  if (node.type === 'TEXT') {
    var textNode = node as TextNode;
    var textData: ComponentData = {
      ...baseData,
      characters: textNode.characters,
      fontSize: extractNumber(textNode.fontSize),
      fontName: textNode.fontName === figma.mixed ? null : textNode.fontName,
      textAlignHorizontal: textNode.textAlignHorizontal,
      textAlignVertical: textNode.textAlignVertical,
      fills: extractFills(textNode.fills),
      lineHeight: textNode.lineHeight === figma.mixed ? null : textNode.lineHeight,
      letterSpacing: textNode.letterSpacing === figma.mixed ? null : textNode.letterSpacing,
      textDecoration: textNode.textDecoration !== figma.mixed && textNode.textDecoration !== 'NONE' ? textNode.textDecoration : null,
      textCase: textNode.textCase !== figma.mixed && textNode.textCase !== 'ORIGINAL' ? textNode.textCase : null,
    };
    return textData;
  }
      
  if (node.type === 'RECTANGLE' || node.type === 'ELLIPSE') {
    var shapeNode = node as RectangleNode | EllipseNode;
    var shapeData: ComponentData = {
      ...baseData,
      fills: extractFills(shapeNode.fills),
      strokes: extractFills(shapeNode.strokes),
      cornerRadius: 'cornerRadius' in shapeNode ? extractNumber((shapeNode as any).cornerRadius) : null,
      effects: shapeNode.effects,
    };
    return shapeData;
  }
      
  if (node.type === 'FRAME' || node.type === 'GROUP') {
    var containerNode = node as FrameNode | GroupNode;
    var containerData: ComponentData = {
      ...baseData,
      children: 'children' in containerNode ? 
        (containerNode as any).children.map(function(child: SceneNode) {
          return extractNodeData(child);
        }) : [],
      fills: 'fills' in containerNode ? extractFills((containerNode as any).fills) : null,
      layoutMode: 'layoutMode' in containerNode ? extractLayoutMode((containerNode as any).layoutMode) : "NONE",
      itemSpacing: 'itemSpacing' in containerNode ? extractNumber((containerNode as any).itemSpacing) : null,
      paddingTop: 'paddingTop' in containerNode ? extractNumber((containerNode as any).paddingTop) : null,
      paddingRight: 'paddingRight' in containerNode ? extractNumber((containerNode as any).paddingRight) : null,
      paddingBottom: 'paddingBottom' in containerNode ? extractNumber((containerNode as any).paddingBottom) : null,
      paddingLeft: 'paddingLeft' in containerNode ? extractNumber((containerNode as any).paddingLeft) : null,
      primaryAxisAlignItems: 'primaryAxisAlignItems' in containerNode ? (containerNode as any).primaryAxisAlignItems : undefined,
      counterAxisAlignItems: 'counterAxisAlignItems' in containerNode ? (containerNode as any).counterAxisAlignItems : undefined,
    };
    return containerData;
  }
      
  return baseData;
}

figma.ui.onmessage = async function(msg: { type: string; [key: string]: any }) {
  if (msg.type === 'get-api-key') {
    try {
      const apiKey = await figma.clientStorage.getAsync('claude-api-key');
      figma.ui.postMessage({
        type: 'api-key-loaded',
        apiKey: apiKey || ''
      });
    } catch (error) {
      console.error('Error loading API key:', error);
      figma.ui.postMessage({
        type: 'api-key-loaded',
        apiKey: ''
      });
    }
    return;
  }

  if (msg.type === 'save-api-key') {
    try {
      await figma.clientStorage.setAsync('claude-api-key', msg.apiKey);
      console.log('API key saved successfully');
    } catch (error) {
      console.error('Error saving API key:', error);
    }
    return;
  }

  if (msg.type === 'test-api-key') {
    console.log('🧪 Received API key test request, silent:', msg.silent);
    
    // Instead of testing the API in TypeScript, send the request back to UI to handle
    figma.ui.postMessage({
      type: 'test-api-key-in-ui',
      apiKey: msg.apiKey,
      silent: msg.silent || false
    });
    return;
  }

  if (msg.type === 'generate-code-claude') {
    try {
      const prompt = createPrompt(msg.componentData, msg.outputFormat);
      const generatedCode = await callClaudeAPI(msg.apiKey, prompt);
      
      figma.ui.postMessage({
        type: 'code-generated',
        success: true,
        code: generatedCode,
        outputFormat: msg.outputFormat
      });
      
    } catch (error) {
      figma.ui.postMessage({
        type: 'code-generated',
        success: false,
        error: (error as Error).message || 'Unknown error',
        outputFormat: msg.outputFormat
      });
    }
    return;
  }

  if (msg.type === 'generate-code') {
    var selection = figma.currentPage.selection;
    
    if (selection.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select an object first, then make it a component'
      });
      return;
    }

    if (selection.length > 1) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select only one object at a time'
      });
      return;
    }

    var selectedNode = selection[0];

    // Only allow COMPONENT type, not INSTANCE
    if (selectedNode.type !== 'COMPONENT') {
      figma.ui.postMessage({
        type: 'error',
        message: 'Make the selected "' + selectedNode.type + '" a component. Right-click and select "Create component" or use Ctrl+Alt+K (Cmd+Option+K on Mac)'
      });
      return;
    }

    // Generate and log the hierarchical JSON structure
    var componentJSON = createComponentJSON(selectedNode as ComponentNode);
    
    console.log("🔍 COMPONENT JSON STRUCTURE");
    console.log("============================");
    console.log(JSON.stringify(componentJSON, null, 2));
    console.log("============================");
    console.log("✅ JSON structure generated! Check console for the complete hierarchy.");

    // If we get here, it's a valid component
    var componentData: ComponentData;
    componentData = extractComponentData(selectedNode as ComponentNode);

    figma.ui.postMessage({
      type: 'component-data',
      data: componentData
    });
  }

  if (msg.type === 'close') {
    figma.closePlugin();
  }
};