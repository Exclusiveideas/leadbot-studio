export type PlatformId =
  | "html"
  | "wordpress"
  | "shopify"
  | "wix"
  | "squarespace"
  | "webflow"
  | "framer";

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  description: string;
  instructions: string[];
  codeTemplate?: (embedCode: string, appUrl: string) => string;
  additionalNotes?: string[];
}

// Version bump this when making widget changes to bust browser cache
const WIDGET_VERSION = "1.1.0";

const getScriptEmbed = (embedCode: string, appUrl: string): string => {
  return `<!-- LeadBotStudio Chatbot Widget -->
<script src="${appUrl}/widget.min.js?v=${WIDGET_VERSION}"></script>
<script>
  LeadBotStudio.init({
    chatbotId: '${embedCode}',
    position: 'bottom-right'
  });
</script>`;
};

export const EMBED_PLATFORMS: PlatformConfig[] = [
  {
    id: "html",
    name: "Custom HTML",
    description: "For websites where you have direct access to HTML code",
    instructions: [
      "Copy the script code below",
      "Paste it before the closing </body> tag in your HTML",
      "Save the file and refresh your website",
      "A floating chatbot button will appear in the bottom-right corner",
    ],
    codeTemplate: getScriptEmbed,
    additionalNotes: [
      "The script creates a floating chatbot button that won't interfere with your page layout",
      "You can customize the position in the init() call (e.g., 'bottom-left', 'top-right')",
      "The button is responsive and adapts to mobile devices automatically",
    ],
  },
  {
    id: "wordpress",
    name: "WordPress",
    description: "For WordPress websites (works with any theme)",
    instructions: [
      "Install 'Simple Custom CSS and JS' plugin (or similar header/footer code plugin)",
      "Go to Custom CSS & JS → Add Custom JS",
      "Paste the script code below",
      "Set location to 'Footer' and apply to 'All pages'",
      "Save and visit your website to see the floating chatbot button",
    ],
    codeTemplate: getScriptEmbed,
    additionalNotes: [
      "The floating button appears on all pages of your WordPress site",
      "Works with any WordPress theme including Astra, GeneratePress, OceanWP, etc.",
      "Compatible with page builders like Elementor, Divi, and WPBakery",
      "The chatbot won't interfere with your site's design or mobile responsiveness",
    ],
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "For Shopify online stores",
    instructions: [
      "Go to Shopify Admin → Online Store → Themes",
      'Click "Actions" → "Edit code" on your active theme',
      "In the Layout folder, click on theme.liquid",
      "Scroll to the bottom and find the closing </body> tag",
      "Paste the code snippet just before </body>",
      'Click "Save" and visit your store to see the floating chatbot button',
    ],
    codeTemplate: getScriptEmbed,
    additionalNotes: [
      "The floating chatbot button will appear on all pages of your store",
      "Make sure your theme allows code editing (some locked themes don't)",
      "The button won't interfere with your store's checkout or cart functionality",
    ],
  },
  {
    id: "wix",
    name: "Wix",
    description: "For Wix websites (drag-and-drop builder)",
    instructions: [
      "Open your Wix site editor",
      "Click 'Settings' → 'Custom Code' (requires Premium plan)",
      "Click 'Add Custom Code' in the body section",
      "Paste the script code below",
      "Set 'Load code on' to 'All pages' and place in 'Body - end'",
      "Save and publish your site to see the floating chatbot button",
    ],
    codeTemplate: getScriptEmbed,
    additionalNotes: [
      "Requires Wix Premium plan for Custom Code feature",
      "The floating button appears on all pages of your Wix site",
      "Alternative: Use Wix's 'Embed a Widget' element and paste the script code",
      "The chatbot is mobile-responsive and works with all Wix templates",
    ],
  },
  {
    id: "squarespace",
    name: "Squarespace",
    description: "For Squarespace websites",
    instructions: [
      "Go to Settings → Advanced → Code Injection (requires Business plan or higher)",
      "Paste the script code below in the 'Footer' section",
      "Click Save",
      "Visit your live site to see the floating chatbot button",
    ],
    codeTemplate: getScriptEmbed,
    additionalNotes: [
      "Requires Squarespace Business plan or higher for Code Injection",
      "The floating button appears on all pages of your Squarespace site",
      "Alternative: Add a Code Block on individual pages (works on all plans)",
      "The chatbot is mobile-responsive and works with all Squarespace templates",
    ],
  },
  {
    id: "webflow",
    name: "Webflow",
    description: "For Webflow websites",
    instructions: [
      "Go to Project Settings → Custom Code tab",
      "Paste the script code below in the 'Footer Code' section",
      "Click Save Changes",
      "Publish your site to see the floating chatbot button",
    ],
    codeTemplate: getScriptEmbed,
    additionalNotes: [
      "Requires a paid Webflow site plan (Basic hosting or above)",
      "The floating button appears on all pages of your Webflow site",
      "Works seamlessly with Webflow's responsive design",
      "The chatbot automatically adapts to your site's breakpoints",
    ],
  },
  {
    id: "framer",
    name: "Framer",
    description: "For Framer websites (visual design tool)",
    instructions: [
      "Add a 'Code' component to your canvas (Insert → Code)",
      "Paste the script code below",
      "Set the component position to 'Fixed' or place it at the bottom of your page",
      "Publish your site to see the floating chatbot button",
    ],
    codeTemplate: getScriptEmbed,
    additionalNotes: [
      "The floating button appears on all pages of your Framer site",
      "Works on all Framer plans including free",
      "The chatbot is fully responsive and works with Framer's breakpoints",
      "You can customize the button position in the script's init() call",
    ],
  },
];

export const getPlatformById = (
  id: PlatformId,
): PlatformConfig | undefined => {
  return EMBED_PLATFORMS.find((platform) => platform.id === id);
};

export const getEmbedCodeForPlatform = (
  platformId: PlatformId,
  embedCode: string,
  appUrl: string,
): string => {
  const platform = getPlatformById(platformId);
  if (!platform || !platform.codeTemplate) {
    return "";
  }
  return platform.codeTemplate(embedCode, appUrl);
};
