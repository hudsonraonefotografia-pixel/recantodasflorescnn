const fs = require('fs');
let c = fs.readFileSync('src/pages/Payment.tsx', 'utf8');

const regex = /visual:\s*\{\s*style:\s*\{\s*theme:\s*"dark",\s*customVariables:\s*\{\s*baseColor:\s*"#E09B76"\s*\}\s*\},\s*\},/m;

c = c.replace(regex, `visual: {
      style: {
        theme: "dark",
        customVariables: {
          formBackgroundColor: "transparent",
          baseColor: "#e91e63",
          textPrimaryColor: "#f6faf6",
          textSecondaryColor: "#8fa394",
          inputBackgroundColor: "#132f1f",
        }
      },
    },`);

fs.writeFileSync('src/pages/Payment.tsx', c);
