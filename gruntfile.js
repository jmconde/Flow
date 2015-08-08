module.exports = function(grunt) {
    grunt.initConfig({
        uglify: {
            main: {
                src: "js/flow.js",
                dest: 'js/flow.min.js'
            }
        },
        jshint: {
            all: ["js/flow.js"],
            options: {
                //curly: true,
                //undef: true,
                //notypeof: true,
                /*globals: {
                    jquery: true,
                    devel: true
                }*/
            }
        },
		jscs: {
    		main: [ "js/flow.js" ]
		},
        complexity: {
            generic: {
                src: ['js/flow.js'],
                options: {
                    breakOnErrors: true,
                    errorsOnly: false,               // show only maintainability errors
                    cyclomatic: 12,          // or optionally a single value, like 3
                    halstead: 20,           // or optionally a single value, like 8
                    maintainability: 100,
                    hideComplexFunctions: false,     // only display maintainability
                    broadcast: false                 // broadcast data over event-bus
                }
            }
        }
	});
	
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-complexity');
	grunt.loadNpmTasks('grunt-jscs');
    
    grunt.registerTask("default", ["jshint", "jscs", "uglify", "complexity"]);
};