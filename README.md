`/upload-files` Permette di caricare le immagini da elaborare
**Method**: `POST`
**Content-Type**: `multipart/form-data; boundary=<calculated when request is sent>`
**Body**: `<files> in single field`
**Response**: `{ id: {id} }`

Viene creata la directory **{id}** con al suo interno due directory:

- **images** contenente i <files> inviati nel body
- **models** utilizzata per i file generati

```
- {id}
  - images
  - models
```

`/process` Avvia il processo su un determinato folder {id}
Il processo scatena una exec asyncrona che genererà l'oggetto 3d .usdz nel folder models

**Method**: `POST`
**Content-Type**: `application/json`
**Body**: `{ id: {id} }`
**Response**: `{ id: {id}, uuid: {uuid} }`

`/convert` Converte il file .usdz in .obj e .mtl

**Method**: `POST`
**Content-Type**: `application/json`
**Body**: `{ id: {id} }`
**Response**: `{ id: {id} }`

Resources [lib]:

- https://developer.apple.com/documentation/realitykit/creating_a_photogrammetry_command-line_app
- https://github.com/SamusAranX/USDConverter
