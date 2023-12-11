const express = require('express');
const fs = require('fs/promises');

const app = express();
const port = 8080;

// Middleware to log requests to console messaging.
app.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  next();
});

// Utility function to format JSON data so that it's readable for my professor.
const formatJsonResponse = (data) => JSON.stringify(data, null, 2);

// Function that eliminates repititiveness in my APIs.
const handleApiRequest = async (filePath, filterFunction, errorMessage, req, res) => {
  try {
    // Reads the JSON file
    const data = await fs.readFile(filePath, 'utf8');

    // Parse the JSON data
    const jsonData = JSON.parse(data);

    // Applies the filter function to get the desired data
    const filteredData = filterFunction(jsonData, req);

    //Checks if filteredData is defined. If not an array, it considers the condition to be true, ensuring that the overall check is successful for both array and non-array cases.
    if (filteredData !== undefined && (Array.isArray(filteredData) ? filteredData.length > 0 : true)) { 
      
      // Format the JSON data
      const formattedData = formatJsonResponse(filteredData);

      // Set the Content-Type header to ensure proper rendering
      res.setHeader('Content-Type', 'application/json');

      // Send the formatted JSON data as the response
      res.send(formattedData);
    } else {
      // Send an error response if no matching data is found
console.log(`No data found for the specified criteria in ${req.url}`);
res.status(404).json({ error: `No data found for the specified criteria in ${req.url}` });

    }
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    res.status(500).send('Internal Server Error');
  }
};

// Returns JSON for all artists. 
app.get('/api/artists', async (req, res) => {
  const filePath = 'artists.json';
  const filterFunction = (data) => data;
  const errorMessage = 'No artists found';
  await handleApiRequest(filePath, filterFunction, errorMessage, req, res);
});

// Returns JSON for all artists from the specified nationality 
app.get('/api/artists/:country', async (req, res) => {
  const filePath = 'artists.json';
  const filterFunction = (data, req) => {
    const requestedNationality = req.params.country.toLowerCase(); //Takes care of case sensitivity.
    return data.filter(artist => artist.Nationality.toLowerCase() === requestedNationality);
  };
  const errorMessage = 'No artists found for the specified country';
  await handleApiRequest(filePath, filterFunction, errorMessage, req, res);
});

// Returns JSON for all galleries
app.get('/api/galleries', async (req, res) => {
  const filePath = 'galleries.json';  
  const filterFunction = (data) => data;  
  const errorMessage = 'No galleries found'; 
  await handleApiRequest(filePath, filterFunction, errorMessage, req, res);
});

// Returns JSON for all galleries from the specified country
app.get('/api/galleries/:country', async (req, res) => {
  const filePath = 'galleries.json';
  const filterFunction = (data, req) => {
    //More case sensitivity handling
    const requestedCountry = req.params.country.toLowerCase();
    return data.filter(gallery => gallery.GalleryCountry.toLowerCase() === requestedCountry);
  };
  const errorMessage = 'No galleries found for the specified country';
  await handleApiRequest(filePath, filterFunction, errorMessage, req, res);
});

// Returns JSON for all paintings from the nested file.
app.get('/api/paintings', async (req, res) => {
  const filePath = 'nested.JSON'; 
  const filterFunction = (data, req) => data;  // No filtering needed for all paintings
  const errorMessage = 'Error getting paintings';
  await handleApiRequest(filePath, filterFunction, errorMessage, req, res);
});

// Returns JSON for the single painting whose id matches the provided id
app.get('/api/painting/:paintingID', async (req, res) => {
  try {
    const requestedPaintingID = Number(req.params.paintingID); // Convert to number so no sneaky strings can interfere with request.

    const filterFunction = (data) => {

      const foundPainting = data.find(painting => painting.paintingID === requestedPaintingID);

      return foundPainting;
    };

    const errorMessage = 'Painting not found';
    await handleApiRequest('nested.JSON', filterFunction, errorMessage, req, res);
  } catch (error) {
    console.error('Error reading JSON file:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Returns JSON for the paintings whose gallery id matches the provided gallery id for the nested JSON file.
app.get('/api/painting/gallery/:galleryID', async (req, res) => {
  try {
    const requestedGalleryID = parseInt(req.params.galleryID, 10); // Convert to integer

    const filterFunction = (data) => {
      return data.filter(painting => painting.gallery && painting.gallery.galleryID === requestedGalleryID);
    };

    const errorMessage = 'No paintings found for the specified galleryID';
    await handleApiRequest('nested.JSON', filterFunction, errorMessage, req, res);
  } catch (error) {
    console.error('Error reading JSON file:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Returns JSON for the paintings whose artist id matches the provided artist id (from the nested file)
app.get('/api/painting/artist/:artistID', async (req, res) => {
  const filePath = 'nested.JSON';  // Specify the JSON file path
  const filterFunction = (data, req) => {
    const requestedArtistID = parseInt(req.params.artistID, 10);
    return data.filter(painting => painting.artist && painting.artist.artistID === requestedArtistID);
  };
  const errorMessage = 'Error getting paintings by artist';
  await handleApiRequest(filePath, filterFunction, errorMessage, req, res);
});

// Returns JSON for paintings whose yearOfWork is between the provided min and max values (from the nested file).
app.get('/api/painting/year/:min/:max', async (req, res) => {
  const filePath = 'nested.JSON';
  const filterFunction = (data, req) => {
   
    const minYear = parseInt(req.params.min, 10);
    const maxYear = parseInt(req.params.max, 10);
    return data.filter(
      painting =>
        painting.yearOfWork && 
        //Operated under assumption that values were inclusive so Min=1990 would include 1990 and not start at 1991. My apologies if this was an incorrect assumption.
        parseInt(painting.yearOfWork, 10) >= minYear &&
        parseInt(painting.yearOfWork, 10) <= maxYear
    );
  };
  const errorMessage = 'Error getting paintings by year range';
  await handleApiRequest(filePath, filterFunction, errorMessage, req, res);
});

// Returns JSON for paintings whose title contains the provided text (case-insensitive)
app.get('/api/painting/title/:text', async (req, res) => {
  const filePath = 'nested.JSON';
  const filterFunction = (data, req) => {
    const searchText = req.params.text.toLowerCase();
    return data.filter(painting => painting.title && painting.title.toLowerCase().includes(searchText));
  };
  const errorMessage = 'Error getting paintings by title';
  await handleApiRequest(filePath, filterFunction, errorMessage, req, res);
});

// Returns JSON for paintings that have a color matching the provided hex value (case-insensitive)
app.get('/api/painting/color/:name', async (req, res) => {
  const filePath = 'nested.JSON';
  const filterFunction = (data, req) => {
    const searchColorName = req.params.name.toLowerCase();
    //A good 40% of this assignment was troubleshooting why I couldn't properly access the dominantColors attribute.
    return data.filter(
      painting =>
        painting.details &&
        painting.details.annotation &&
        painting.details.annotation.dominantColors &&
        // Use the some method to determine if any dominant color matches the search color
        painting.details.annotation.dominantColors.some(color => {
          // Extract the lowercase version of the color name, trimming any leading or trailing spaces
          const lowerCaseColorName = color.name ? color.name.toLowerCase().trim() : '';
          // Check if the search color name is included in the lowercase color name
          return lowerCaseColorName.includes(searchColorName);
        })
    );
  };
  const errorMessage = 'Error getting paintings by color';
  await handleApiRequest(filePath, filterFunction, errorMessage, req, res);
});

// Starts the server up.
app.listen(port, () => {
  console.log(`Server is available for use on port: ${port}`);
});
