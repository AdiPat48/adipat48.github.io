# Aditi Pathak – Academic Website

This repository contains the source code for my academic website, hosted at [https://adipat48.github.io](https://adipat48.github.io).

## Technology Stack
Built entirely without heavy frameworks to ensure speed, flexibility, and longevity:
- **Vanilla HTML5**
- **Vanilla CSS3**
- **Vanilla JavaScript**

## Managing Content
The website is designed with a custom, ultra-lightweight content management system. You edit regular `.txt` files instead of messy HTML. 

1. **Information & Text**: Navigate to the `content/` folder. Each section of the website has a corresponding `.txt` text file. Editing the text in these files will automatically update the content on the live site after a bare refresh.
2. **Colors & Navigation**: The `content/config.js` file stores all global site variables. Modify the hexadecimal colours in this dictionary or add/remove buttons from the `nav` list. 

*Note: after making edits, it is helpful to bump the `version` number inside `config.js` to automatically clear browser caches for your visitors.*
