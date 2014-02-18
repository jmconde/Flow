![alt text](http://lab.xintana.com/flow/images/logoflow.jpg "Flow")
# Flow

## Introducción

### Flow
Opciones:
#### title
#### pageClass
#### featureClass
#### autostart
#### env
#### defaultInTransition
#### defaultOutTransition
#### templates
#### flow
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