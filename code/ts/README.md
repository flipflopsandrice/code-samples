# ts

I've worked on several projects for the largest ticket-selling platform in Europe. The first project
was a proof-of-concept to research techniques and methodologies usable for the next phase. Code in this repo
is from the offspring of that first project. 

About 70% of my work was back-end, the rest was front-end and
managing and tutoring a junior developer.

## shop-fe and shop-api

A hyper-responsive, scalable and customizable shop for selling large amounts of tickets.

The project was set-up with Heroku, Github (using Gitflow), TravisCI and Scrutinizer.

The back-end contained state, but no practical data (this was pulled from the so-called 'sales-channel').
Work was done in the wonderful Silex microframework, with PHPUnit tests, with cloud-based Memcached for state-keeping
and Docker for development and deployment.

The front-end was as simple - yet responsive - as possible, containing only the minimum required code
for hyper-responsiveness. All rendering was done server-side, except UI and state (by state-injection).
Project was built up using Gulp, NPM and Bower for dependencies, Browserify and Handlebars (+ lightncandy),
and used Selenium and Nightwatch for unit/e2e tests.

[view code samples](api/)

## sales-channel

A hypermedia-inspired microservice containing all ticket and shop information,
but performing no actual business-logic concerning client sales. Designed to be
opened up to third parties. 

Built using the Silex microframework, PHPUnit, a Swagger
specification and mocking server, Docker for development and deployment, PostgreSQL
with mixed relational and BSON data structure, and Heroku + TravisCI for additional testing.

[view code samples](sc/)
