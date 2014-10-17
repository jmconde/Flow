![Flow](http://joseconde.info/images/logoflow.jpg)

v0.6.0

## Introducción

### Flow
Opciones:
#### title
Título de la página
#### pageTag
*Default: "article".*

Tag con el que se crea la tabla.
#### pageClass
*Default: "flow-page".*

Atributo class que se le asigna al elemnto página.
#### featureClass
*Default: "flow-feature".*

Atributo class con que se identifica cada feature.
#### autostart
*Default: true.*
#### env
Se usa para definir el ambiente en el cual se ejecuta.
#### defaultInTransition
Transición de entrada por defecto para todas las páginas.
#### defaultOutTransition
Transición de salida por defecto para todas las páginas.
#### templates

Array. Contiene la definición de las plantillas.
#### aftershowpage
Función que se ejecuta luego de mostrar cada página

#### flow
Define el flujo principal de la aplicación.
Opciones:
#####id
id de la pagina, si no existe se crea
#####onexit
#####onshow
#####beforeshow
#####beforeloadcontent,
#####title
#####label
#####roles
#####disabled
#####content
######url
URL del contenido puede contener parametros de la forma {param1}. Por ejemplo:
>http://localhost/autos/color/{color}/
######handler
Función que maneja el contenido
######format
- "json"

Por lo pronto solo se maneja ese tipo de contenido.

######route
Nombre de la ruta.
######template
Nombre del template para el contenido

----------

### Routes
Objeto donde se guarda la información de las rutas de la aplicación.

#### Sin ambientes

	$.extend(Routes, {
	   	base: "http://mydomain.com/",
	    routes: {
	    	endpoint1: "/services/endpoint1.json",
		    endpoint2: "/services/endpoint1/{param1}/{param2}.json",
	    }
    });

#### Con ambientes

        $.extend(Routes, {
			development: {
    			base: "http://mydevelopmentdomain.com/",
			    routes: {
			    	endpoint1: "/services/endpoint1.json",
				    endpoint2: "/services/endpoint1/{param1}/{param2}.json",
			    }
		    },
		    production: {
			    base: "http://mydomain.com/",
			    routes: {
			    	endpoint1: "/services/endpoint1.json",
				    endpoint2: "/services/endpoint1/{param1}/{param2}.json",
			    }
		    }
    	});




### Behaviors
### Handlers
### Messages
