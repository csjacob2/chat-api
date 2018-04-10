module.exports = function(grunt) {
    grunt.initConfig({
        less: {
            development: {
                options: {
                    paths: ['less']
                },
                files: {
                    'public/css/styles.css': 'public/less/styles.less' // destination file / source file
                }
            }
        },
        browserify: {
            main: {
                src: 'public/scripts/_functions.js',
                dest: 'public/scripts/functions.js'
            }
        },
        watch: {
            files: ['**/*.less', 'public/scripts/*'], // which files to watch
            tasks: ['less', 'default']
        }
    });
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.registerTask('default', ['less', 'watch']);
    grunt.registerTask('default', ['browserify', 'watch']);
};