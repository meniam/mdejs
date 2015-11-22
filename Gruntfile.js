module.exports = function (grunt) {

    if (grunt.option('q') || grunt.option('quiet')) {
        require('quiet-grunt');
    }

    // Project configuration.
    var config = {
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            options: {
                sourceMap: true,
                banner: ';/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
                footer: '\n'
            },
            dist: {
                src: [
                    'src/mde.js'
                ],
                dest: 'dist/<%= pkg.name %>.js'
            },
            test: {
                src: '<%= concat.dist.src %>',
                dest: '.build/<%= pkg.name %>.js',
                options: {
                    sourceMap: false
                }
            }
        },

        clean: ['.build/'],

        uglify: {
            options: {
                sourceMap: true,
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
                }
            }
        },

        endline: {
            dist: {
                files: {
                    'dist/<%= pkg.name %>.js': 'dist/<%= pkg.name %>.js',
                    'dist/<%= pkg.name %>.min.js': 'dist/<%= pkg.name %>.min.js'
                }
            }
        }
    };

    grunt.initConfig(config);
    require('load-grunt-tasks')(grunt);

    grunt.registerTask('test', ['clean', 'concat:test', 'clean']);
    grunt.registerTask('build', ['concat:dist', 'uglify', 'endline']);

    // Default task(s).
    grunt.registerTask('default', ['build']);
};