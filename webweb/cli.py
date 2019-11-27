import click
from webweb import Web


@click.command()
@click.argument('path', required=True)
def show(path):
    """attempts to read a file and display a webweb from it.

    idea: JG-Young
    """
    Web(path=path).show()

show()
