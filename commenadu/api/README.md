# Back end api for Commenadu
## Req:
* Node
* Sqlite3
* Yarn
* Terminal/Editor opened at the ```commendau/api/``` level rather than the repo root
* ```constants.ts``` file found on the team drive
  * This must be placed in the ```src/``` folder
## Run:
* Run ```yarn``` to install needed dependencies
* ```yarn tsnode``` for test env run
* ```yarn build``` for build to production JS
* Run ```node build/src/index.js``` to run production JS
## Test:
* ```yarn test``` to run the Jest tests
* Tests are a good example of the usage of the various routes
## API:
* Routes can be followed in the routes folder where each successive folder extends the path with the folder name
* Routes with user modification, i.e., anything other than viewing things, requires a request to have the JWT of the current user in the authorization header field of any request
  * The JWT is received when the create user or login user route is used
  * A user cannot modify something they have not created
  * A user cannot like their own comment
* For the frontend to work on sites with https, the api must have https as well. This can be done by placing the api behind a reverse-proxy (e.g., Nginx).
## Docker:
In Docker-compose:
```
api:
    container_name: api
    build:
      context: ./api
      dockerfile: Dockerfile
    restart: "always"
    ports:
      - 3000:3000
```
Via CLI:
```
docker build ./api/Dockerfile
docker run -p 3000:3000 -d -t [image hash] node src/index.js
```
Image hash needed for the second command is given in the last line of the first command's execution.
