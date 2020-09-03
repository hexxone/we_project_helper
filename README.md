# Wallpaper Engine project.json helper utility

Since I prefer editing the "project.json" file of a wallpaper engine project manually
and the properties are not ordered by its "order" (like in the WE-gui) but by the name,
I decided to create a small tool which sorts such a file by "order" and saves it,
without breaking the ".json" format.

The sorted file will be written to the same place as the input, with the suffix `.new`.
See `/example` folder.

Sadly, the json format doesn't really support property-sorting by default and I just implemented my own...
Maybe there are better ways for doing this, but having more control over the process also allows for more tweaks and features.

E.g.: While I was on it, I put in the ability to increment an "order" above a given value, by a given amount.
This makes it easier to add new properties in the middle without having to go through all the following ones and manually incrementing them...

Maybe someone will find this useful someday ‾\\_(ツ)_/‾
