## Description

A simple Chat API that reads and posts data from a simple node server (`server.js`).

## Files

1. `axios` is required for GET/POST requests from node.js.
2. All files and folders are stored in `public`.
3. LESS is written and stored in the LESS folder, compiled with `grunt` and CSS stored in the CSS folder.
4. Javascript/jQuery is written in `_functions.js` and packaged with `browserify` into `functions.js`. Both files are stored, along with `handlebars.js` in the scripts folder.
5. External files are required and accessed through CDNs: `Bootstrap`, `popper.js` and jquery.
6. `index.html` and the handlebars template is stored in the root of `public`.

## To Run
1. Run `npm start` (or run a localhost) to run the app server.
2. Run an `npm install` to install any dependencies.
3. Launch the node server with `npm run api-server`.
4. Navigate to `http://localhost:3000` and test accordingly.