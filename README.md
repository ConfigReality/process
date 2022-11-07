# Workflow

Richiamando l'endpoint `/upload-files` sarà possibile iniziare il processo di generazione delle immagini caricate in un modello 3d in formato usdz, obj e mtl (correlato della texture)

## Steps

1. Upload files in una directory temporanea (tmp)
2. Processo di generazione del modello 3d .usdz
3. Conversione da .usdz in .obj e .mtl
4. Al termine degli step 2 e 3 le immagini caricate allo step 1 verranno eliminate.
   > La risposta all'endpoint richiamato avverrà subito dopo aver caricato le immagini nella directory temporanea (tmp)

# API

## `/upload-files`

Permette di caricare le immagini da elaborare
**Method**: `POST`
**Content-Type**: `multipart/form-data; boundary=<calculated when request is sent>`
**Body**: `<files> in single field`
**Response**: `{ id: {id} }`

Viene creata la directory **{id}** con al suo interno due directory:

- **images** contenente i <files> inviati nel body
- **models** utilizzata per i file generati

```
/ {id}
  / images
  / models
```

## `/process`

Avvia il processo su un determinato folder {id}
Il processo scatena una exec asyncrona che genererà l'oggetto 3d .usdz nel folder models

**Method**: `POST`
**Content-Type**: `application/json`
**Body**: `{ id: {id} }`
**Response**: `{ id: {id}, uuid: {uuid} }`

## `/convert`

Converte il file .usdz in .obj e .mtl

**Method**: `POST`
**Content-Type**: `application/json`
**Body**: `{ id: {id} }`
**Response**: `{ id: {id} }`

Resources [lib]:

- https://developer.apple.com/documentation/realitykit/creating_a_photogrammetry_command-line_app
- https://github.com/SamusAranX/USDConverter
