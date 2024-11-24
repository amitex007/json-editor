const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { z } = require('zod');


const app = express();
const PORT = 3000;
const CONFIG_FILE = path.join(__dirname, 'config.json');


// Define the Zod schema for configuration
const configSchema = z.object({
  setting1: z.string().min(1, 'Setting 1 must not be empty'),
  setting2: z.number().min(0, 'Setting 2 must be a positive number'),
  enableFeature: z.boolean()
});


// Middleware to parse JSON
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


function zodToJsonSchema(zodSchema) {
  const jsonSchema = zodSchema._def.typeName === 'ZodObject' ? {} : null;
  const properties = {};
  const required = [];

  for (const [key, value] of Object.entries(zodSchema.shape)) {
    const type = value._def.typeName;
    required.push(key);

    switch (type) {
      case 'ZodString':
        properties[key] = { type: 'string', title: key };
        break;
      case 'ZodNumber':
        properties[key] = { type: 'number', title: key };
        break;
      case 'ZodBoolean':
        properties[key] = { type: 'boolean', title: key };
        break;
      default:
        throw new Error(`Unsupported type: ${type}`);
    }
  }

  jsonSchema.type = 'object';
  jsonSchema.properties = properties;
  jsonSchema.required = required;

  return jsonSchema;
}

// Serve the editor UI
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

app.get('/', (req, res) => {
  const schema = zodToJsonSchema(configSchema);
  console.log(schema)
  res.render('index', { schema: JSON.stringify(schema) });
});

// API to save config file
app.post('/save-config', (req, res) => {
  console.log("received request for config save")
  const configData = req.body;

  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configData, null, 2));
    res.json({ message: 'Configuration saved successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save configuration file.' });
  }
});

// API to fetch the current config
app.get('/get-config', (req, res) => {
  try {
    const data = fs.existsSync(CONFIG_FILE) ? fs.readFileSync(CONFIG_FILE) : '{}';
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load configuration file.' });
  }
});

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
