rm -fr webweb/client
cp -r client webweb
python setup.py sdist
python3 -m twine upload --skip-existing dist/*
