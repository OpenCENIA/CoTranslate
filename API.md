# Documentación de las APIs 

Para el backend de la plataforma se utilizó Django REST de manera que este pueda servir APIs para uso del frontend.

Los modelos de la plataforma se encuentran en `./labelingPlatform/models.py`. En este archivo se encuentran todos los tipos de datos o clases (o modelos) utilizados más adelante.

Las APIs se encuentran en `./labelingPlatform/views.py`, las cuales serán presentadas a continuación siguiendo el mismo orden de dicho archivo.

---

## ProfileView

Por default cuenta con los métodos básicos para obtener, ingresar y actualizar (`GET / POST / PUT`) un nuevo objeto de tipo `Profile`.

En esta view se agregaron las siguientes funciones:


### update_profile 

Actualiza el `role` y las `skills` de un determinado `Profile`. Cuando se crea un nuevo `User` dentro de la plataforma, se activa una especie de `Trigger` que construye un objeto `Profile` y le asocia el `User` creado, sin embargo todos los otros campos del objeto `Profile` se inicializan con los valores por default, por lo que se usa esta función adicional para asignarle un `role` y las `skills` para que pueda hacer uso de la plataforma.

Vistas del 'frontend' que hacen uso de esta función:
* `/frontend/src/context/AuthContext.js` al momento de crear un nuevo usuario en la vista `/frontend/src/views/signUpPage.js`.

La http request para hacer uso de la función `update_profile` es la siguiente:

```http 
PUT /api/profiles/update_profile/
```
Esta debe ir acompañada del siguiente `body`:

```javascript
{
    "username": string,
    "role": number,
    "skills": [number]
}
```

con el `header` 

`"Content-Type": "application/json"`

tal que:

| Key | Type | Description |
| :--- | :--- | :--- |
| `username` | `string` | Nombre del `User` asociado al `Profile` que se quiere actualizar |
| `role` | `number` | Número del `role` que se le quiere asignar. `1`: `Tagger`, `2`: `Manager` |
| `skills` | `[number]` | Arreglo con los números de las skills que se le quieren asignar al `Profile` |

y su `response` es:

```javascript
{
    "status": string,
}
```
`"status"` toma el valor `"Done"` si la actualización del `Profile` fue exitosa. En caso contrario toma el valor `"User not found"` 

---

## CampaignItemAnswerView

Por default cuenta con los métodos básicos para obtener, ingresar y actualizar (`GET / POST / PUT`) un nuevo objeto de tipo `CampaignItemAnswer`.

Los objetos de tipo `CampaignItemAnswer` corresponden a las entradas que se generan cada vez que un `Profile` realiza una traducción o una validación. Están asociadas a un `CampaignItem` (elemento del dataset) y a una `Campaign`.

En esta view se agregaron las siguientes funciones:

### get_campaign_item_answers

Obtiene todos los objetos `CampaignItemAnswer` asociados a una determinada `Campaign`.

Vistas del 'frontend' que hacen uso de esta función:
* `/frontend/src/views/managerPage.js` al momento de presionar el botón `Review` de una `Campaign`.

La http request para hacer uso de la función `get_campaign_item_answers` es la siguiente:

```http 
POST /api/campaign_items_answer/get_campaign_item_answers/
```
Esta debe ir acompañada del siguiente `body`:

```javascript
{
    "campaign": Campaign,
}
```

tal que:

| Key | Type | Description |
| :--- | :--- | :--- |
| `campaign` | `Campaign` | Objeto de tipo `Campaign` |

y su `response` es:

```javascript
{
    "status": number,
    "statusText": string,
    "data": [CampaignItemAnswer],
    ...
}
```
`"status"` contiene el número correspondiente al HTTP Response Code (200 si todo funcionó bien), `"statusText"` el mensaje asociado al `"status"` y `"data"` el arreglo con todos los objetos de tipo `CampaignItemAnswer` encontrados.

### new_answer

Crea un nuevo objeto de tipo `CampaignItemAnswer` cuando un `tagger` hace una traducción o una validación. A diferencia del método `POST` por default para `CampaignItemAnswerView`, esta función determina en que iteración del flujo NLLB se encuentra y se lo asigna al nuevo objeto al momento de crearlo.

Vistas del 'frontend' que hacen uso de esta función:
* `/frontend/src/views/itemTranslationPage.js` al momento de presionar el botón `Send`.
* `/frontend/src/views/itemValidationPage.js` al momento de presionar el botón `Send`.

La http request para hacer uso de la función `new_answer` es la siguiente:

```http 
PUT /api/campaign_items_answer/new_answer/
```
Esta debe ir acompañada del siguiente `body`:

```javascript
{
    "profile": number,
    "campaign": Campaign,
    "campaignItem": CampaignItem,
    "translationQuality": number,
    "type": string,
    "comment": string,
    "translation": string,
    "answerTime": number,
}
```

tal que:

| Key | Type | Description |
| :--- | :--- | :--- |
| `profile` | `number` | id del `Profile`/`Usuario` que crea la nueva `CampaignItemAnswer` |
| `campaign` | `Campaign` | `Campaign` asociada al `CampaignItemAnswer` |
| `campaignItem` | `CampaignItem` | `CampaignItem` asociado al `CampaignItemAnswer` |
| `translationQuality` | `number` | Número correspondiente a la calidad de la traducción: `1`: `Good translation`, `2`: `Bad translation` |
| `type` | `string` | String indicando el tipo de la respuesta, puede ser `"translation"`, `"validation"` o `"editing"` |
| `comment` | `string` | Commentario que el usuario puede escribir cuando tiene el `role` de validador |

y su `response` es:

```javascript
{
    "status": string,
}
```
`"status"` contiene el string `"Done"`.

### get_latest_answer

Obtiene los últimos comentarios o la última traducción de los `CampaignItemAnswer` asociados a un determinado `CampaignItem`.

Vistas del 'frontend' que hacen uso de esta función:
* `/frontend/src/views/itemValidationPage.js` al momento de recibir un item para ser validado.

La http request para hacer uso de la función `get_latest_answer` es la siguiente:

```http 
PUT /api/campaign_items_answer/get_latest_answer/
```
Esta debe ir acompañada del siguiente `body`:

```javascript
{
    "campaignItem": CampaignItem,
    "type": string
}
```

tal que:

| Key | Type | Description |
| :--- | :--- | :--- |
| `campaignItem` | `CampaignItem` | Objeto de tipo `CampaignItem` que recibió el usuario para validar |
| `type` | `string` | Si es `"validate"`, la función buscará la última traducción, si es `"translate"`, los últimos comentarios (este último no se usa en el frontend) |

y su `response` es:

```javascript
{
    "status": string,
    "translation": string,
    "comments": string,
}
```
Cuando `"type"` == `"translate"`, `"status"` contiene el string `"Done"` si todo sale bien.

Cuando `"type"` == `"validate"`, `"status"` contiene el string `"latest"` cuando obtiene la última traducción hecha por un usuario en el flujo `NLLB`, o el string `"default"` cuando la traducción corresponde a la que viene por default en el dataset (cuando aún no hay usuarios que hayan hecho traducciones).

Si `"type"` toma otro valor, `"status"` será `"not implemented"`. 

Las llaves `"translation"` y `"comments"` son excluyentes, solo una se encuentre en el `response` según el valor de `type` ingresado en el body.

### get_user_answers 

Obtiene todas las respuestas de un usuario y las puede filtrar o no por campaña dependiendo del parámetro ingresado.

Vistas del 'frontend' que hacen uso de esta función:
* `/frontend/src/components/ModalStatistics.js` al momento de cargar o actualizar el componente.
* `/frontend/src/views/campaignPage.js` al momento de cargar la página.

La http request para hacer uso de la función `get_user_answers` es la siguiente:

```http 
PUT /api/campaign_items_answer/get_user_answers/
```
Esta debe ir acompañada del siguiente `body`:

```javascript
{
    "userTest": *User,
    "campaign": Campaign | string,
}
```

tal que:

| Key | Type | Description |
| :--- | :--- | :--- |
| `userTest` | `*User*` | Corresponde al authToken decodeado que se recibe de django al momento de iniciar sesión. Contiene los datos del `User` y del `Profile` asociados. Se usa para filtrar los `CampaignItemAnswer` por `User id` |
| `campaign` | `Campaign` | `string` | puede recibir como valor un objeto de tipo `Campaign` o un string. Si es un `Campaign`, filtrará las respuestas por `User id` y `Campaign`. Si es un string vacío, filtrará las respuestas solo por `User id` |

y su `response` es:

```javascript
{
    "status": number,
    "statusText": string,
    "data": [CampaignItemAnswer],
    ...
}
```
`"status"` contiene el número correspondiente al HTTP Response Code (200 si todo funcionó bien), `"statusText"` el mensaje asociado al `"status"` y `"data"` el arreglo con todos los objetos de tipo `CampaignItemAnswer` encontrados.

### edit_answer 

Cambia el estado de un `CampaignItemAnswer` de `validating` a `editing` si es que ese item no tiene asignado ningún validador.

Vistas del 'frontend' que hacen uso de esta función:
* `/frontend/src/views/campaignPage.js` al momento de presionar el botón `Edit` en la tabla de items traducidos.

La http request para hacer uso de la función `edit_answer` es la siguiente:

```http 
PUT /api/campaign_items_answer/edit_answer/
```
Esta debe ir acompañada del siguiente `body`:

```javascript
{
    "answer": CampaignItemAnswer,
}
```

tal que:

| Key | Type | Description |
| :--- | :--- | :--- |
| `answer` | `CampaignItemAnswer*` | Corresponde al `item` que el usuario seleccionó para modificar la traducción que le dió |

y su `response` es:

```javascript
{
    "status": string,
}
```
`"status"`: `"done"` si se pudo actualizar el item, `"Error"` en caso contrario

### get_answer 

Permite obtener el último `CampaignItemAnswer` ingresado en la base de datos para un determinado `CampaignItem` y `User`.

Vistas del 'frontend' que hacen uso de esta función:
* `/frontend/src/views/itemTranslationPage.js` cuando el usuario recibe un `CampaignItem` para traducir y este tiene `status` = `"editing"` usa esta API para conseguir la respuesta asociada al item que está editando y con ello rellenar los campos iniciales.

La http request para hacer uso de la función `get_answer` es la siguiente:

```http 
PUT /api/campaign_items_answer/get_answer/
```
Esta debe ir acompañada del siguiente `body`:

```javascript
{
    "user": number,
    "campaignItem": number
}
```

tal que:

| Key | Type | Description |
| :--- | :--- | :--- |
| `user` | number | `id` del `User` |
| `campaignItem` | number | `id` del `CampaignItem` |

y su `response` es:

```javascript
{
    "status": number,
    "statusText": string,
    "data": [CampaignItemAnswer],
    ...
}
```

`"status"` contiene el número correspondiente al HTTP Response Code (200 si todo funcionó bien), `"statusText"` el mensaje asociado al `"status"` y `"data"` el arreglo con todos los objetos de tipo `CampaignItemAnswer` encontrados (de ese arreglo siempre se toma el primer element ya que si fuera más de uno, todos compartirían el número de iteraciones).

---

## CampaignView

Por default cuenta con los métodos básicos para obtener, ingresar y actualizar (`GET / POST / PUT`) un nuevo objeto de tipo `Campaign`.

En esta view se agregaron las siguientes funciones:


### new_campaign 

Permite crear una nueva `Campaign`. Parece ser igual al método POST default de `CampaignView`, evaluar si es posible borrar esta función.

Vistas del 'frontend' que hacen uso de esta función:
* `/frontend/src/views/managerPage.js` al momento de crear una nueva campaña.

La http request para hacer uso de la función `new_campaign` es la siguiente:

```http 
PUT /api/campaigns/new_campaign/
```
Esta debe ir acompañada del siguiente `body`:

```javascript
{
    "campaign": Campaign
}
```

tal que:

| Key | Type | Description |
| :--- | :--- | :--- |
| `campaign` | `Campaign` | objeto de tipo `Campaign` que se quiere crear |

y su `response` es:

```javascript
{
    "status": string,
    "newCampaignPK": number,
}
```
`"status"` toma el valor `"ok"` siempre. `newCampaignPK` contiene la id de la `Campaign` creada


### upload_dataset 

Permite crear una serie de objetos de tipo `CampaignItem` asociados a una `Campaign` a partir de un dataset.

Internamente, la función descarta la columna con header `"url"` y reserva la columna `"comments"` para mostrar comentarios al momento de agregar una traducción. Para que la carga del dataset funcione correctamente, este debe incluir al menos una columna con un header distinto a los mencionados. Por default, la primera columna siempre corresponderá a la lista con oraciones en el lenguaje original. Si se incluye una segunda columna, esta se usará como una lista con oraciones en el lenguaje `target`. Por ejemplo, si hacemos una campaña donde el lenguaje original es `Español` y queremos traducirlo a `Mapudungún`, este último será el lenguaje `target` internamente.

Vistas del 'frontend' que hacen uso de esta función:
* `/frontend/src/views/managerPage.js` justo después de crear una nueva campaña.

La http request para hacer uso de la función `new_campaign` es la siguiente:

```http 
PUT /api/campaigns/${campaign.id}/
```
Esta debe ir acompañada del siguiente `body`:

```javascript
{
    "campaign": Campaign
}
```

tal que:

| Key | Type | Description |
| :--- | :--- | :--- |
| `campaign` | `Campaign` | objeto de tipo `Campaign` que se creó justo antes de que se llamara esta función |

y su `response` es:

```javascript
{
    "status": string,
}
```
`"status"` toma el valor `"Campaign updated"` siempre.

---

## SkillView

Por default cuenta con los métodos básicos para obtener, ingresar y actualizar (`GET / POST / PUT`) un nuevo objeto de tipo `Skill`.

Vistas del 'frontend' que hacen uso de esta función:
* `/frontend/src/views/managerPage.js` al momento de cargar la vista para conseguir la lista de skills.
* `/frontend/src/views/signUpPage.js` al momento de cargar la lista de skills para mostrárselas al usuario.

---

## CampaignItemView

Por default cuenta con los métodos básicos para obtener, ingresar y actualizar (`GET / POST / PUT`) un nuevo objeto de tipo `CampaignItem`.

En esta view se agregaron las siguientes funciones:


### get_campaign_items 

Permite obtener todos los `CampaignItem` asociados a un `Campaign`.

Vistas del 'frontend' que hacen uso de esta función:
* `/frontend/src/views/campaignPage.js` al momento de cargar la página/vista de una determinada `Campaign`.
* `/frontend/src/views/managerPage.js` al momento apretar el botón `Review` para una determinada `Campaign`.

La http request para hacer uso de la función `get_campaign_items` es la siguiente:

```http 
PUT /api/campaign_items/get_campaign_items/
```
Esta debe ir acompañada del siguiente `body`:

```javascript
{
    "campaign": Campaign
}
```

tal que:

| Key | Type | Description |
| :--- | :--- | :--- |
| `campaign` | `Campaign` | objeto de tipo `Campaign` que se quiere usar para filtrar los `CampaignItem` |

y su `response` es:

```javascript
{
    "status": number,
    "statusText": string,
    "data": [CampaignItem],
    ...
}
```
`"status"` contiene el número correspondiente al HTTP Response Code (200 si todo funcionó bien), `"statusText"` el mensaje asociado al `"status"` y `"data"` el arreglo con todos los objetos de tipo `CampaignItem` encontrados a partir de `Campaign`.


### get_item 

Permite obtener un `CampaignItem` para traducir que no se le haya asignado a ningún otro traductor, o un `CampaignItem` para validar que aún no cuente con la cantidad máxima de validadores. Luego de obtener el `CampaignItem`, le asigna el usuario al campo de translator o validator del `CampaignItem` para evitar que otro usuario lo tome sin que le corresponda.

Lo ideal sería que priorice los `CampaignItem` con un mayor número de iteraciones en el flujo `NLLB` (mayor número de iteraciones = mayor cantidad de veces que fue rechazada la traducción del `CampaignItem`). También debería mantener el orden en el que se asignan los `CampaignItem` lo más cercano al orden inicial del dataset. Falta testear la plataforma para ver bien el cumplimiento de esto.

Vistas del 'frontend' que hacen uso de esta función:
* `/frontend/src/views/itemTranslationPage.js` al momento de cargar la página/vista, después de apretar el botón para obtener un item para traducir en la vista anterior.
* `/frontend/src/views/itemValidationPage.js` al momento de cargar la página/vista, después de apretar el botón para obtener un item para validar en la vista anterior.

La http request para hacer uso de la función `get_item` es la siguiente:

```http 
POST /api/campaign_items/get_item/
```
Esta debe ir acompañada del siguiente `body`:

```javascript
{
    "userTest": *User,
    "campaignId": number,
    "type": string,
}
```

tal que:

| Key | Type | Description |
| :--- | :--- | :--- |
| `userTest` | `*User*` | Corresponde al authToken decodeado que se recibe de django al momento de iniciar sesión. Contiene los datos del `User` y del `Profile` asociados. Se usa para asignarle el `Profile` al `CampaignItem` encontrado. |
| `campaignId` | `number` | `ID` de la `Campaign`. Se usa para filtrar los `CampaignItem` con la `Campaign` seleccionada por el usuario. |
| `type` | `string` | Toma los valores `"translate"` y `"validate"`. Se usa para indicar el tipo de `CampaignItem` que el usuario quiere |

y su `response` es:

```javascript
{
    "status": number,
    "statusText": string,
    "data": [CampaignItem],
    ...
}
```
`"status"` contiene el número correspondiente al HTTP Response Code (200 si todo funcionó bien), `"statusText"` el mensaje asociado al `"status"` y `"data"` el arreglo de un elemento con el objeto de tipo `CampaignItem` encontrado a partir de `Campaign` y del `User ID`.

En caso de que no se encuentre ningún `CampaignItem` con el filtro de `Campaign` y `User`, el `response` contiene solo la llave `"status"` y el valor `"Error"`. 


### update_item 

Actualiza el estado de un `CampaignItem` después de que un usuario lo traduce o valida su traducción. 
* En el caso de que el usuario lo haya traducido, la función cambia su estado de `translating` a `validating` si es que la `Campaign` es de tipo `NLLB`, en caso contrario lo deja con el estado `completed`.
* En el caso de que el usuario haya validado su traducción, revisará si es que cumple con la condición de cantidad máxima de validadores o de `threshold` para cambiar su estado. 
    * Si `Campaign` es `NLLB` y la cantidad de rechazos supera el `threshold` entonces cambia su estado de `validating` a `translating`. 
    * Si `Campaign` es `NLLB` y la cantidad de aprobación supera el `threshold` entonces cambia su estado de `validating` a `completed`. 
    * Si `Campaign` no es `NLLB` y la cantidad de aprobación o rechazo supera el `threshold` entonces cambia su estado de `validating` a `completed`. 

Vistas del 'frontend' que hacen uso de esta función:
* `/frontend/src/views/itemTranslationPage.js` al momento de enviar la traducción para un determinado `CampaignItem`.
* `/frontend/src/views/itemValidationPage.js` al momento de enviar la validación de la traducción de un determinado `CampaignItem`.

La http request para hacer uso de la función `update_item` es la siguiente:

```http 
PUT /api/campaign_items/${campaignItem.id}/update_item/
```
Esta debe ir acompañada del siguiente `body`:

```javascript
{
    "status": string
}
```

tal que:

| Key | Type | Description |
| :--- | :--- | :--- |
| `status` | `string` | string que toma los valores `translating` y `validating` para indicar como se debe actualizar el `CampaignItem` indicado como parte de la url |

y su `response` es:

```javascript
{
    "status": number,
    "statusText": string,
    "data": [CampaignItem],
    ...
}
```
`"status"` contiene el número correspondiente al HTTP Response Code (200 si todo funcionó bien), `"statusText"` el mensaje asociado al `"status"` y `"data"` el arreglo de un elemento con el objeto de tipo `CampaignItem` actualizado. En caso de que haya un dato mal ingresado (campaignItem.id errónea en la url o un status distinto de `translating` y `validating`) retorna el string `"Error"` dentro de la llave `"status"`.
