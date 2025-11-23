from functools import wraps
from typing import Any, Dict, Callable, Type, TypeVar, ParamSpec

from flask import request, jsonify
from flask.typing import ResponseReturnValue
from pydantic import BaseModel as BaseSchema  # Alias to avoid confusion with mesa Models
from pydantic_core import ValidationError


class Schemas:
    """Namespace container for request validation schemas and parsers.

    This class groups related Pydantic models (schemas for internal reasons in this project)
    and parsing decorators used to validate and deserialize incoming request data before it reaches
    Flask view functions. Separating schemas into logical sub-namespaces
    (PathArgs, QueryArgs, BodyArgs) keeps growth manageable as the API
    surface expands.

    Sub-namespaces
    --------------
    * PathArgs: Pydantic models for dynamic URL path segments (currently a placeholder).
    * QueryArgs: Pydantic models for URL query string arguments.
    * BodyArgs: Pydantic models for JSON request bodies (currently a placeholder).
    * Parse: Decorator factory methods integrating validation into Flask routes.

    Example
    -------
    @app.route('/simulation/initialize', methods=['POST'])
    @Schemas.Parse.query_args(Schemas.QueryArgs.SimulationInit)
    def init_simulation(q: Schemas.QueryArgs.SimulationInit) -> ResponseReturnValue:
        return jsonify({'initial_agents': q.initial_agents})
    """

    class PathArgs:
        """Placeholder namespace for path parameter schemas.

        Add Pydantic models here as the API evolves; keeps organization
        symmetric with query/body argument handling.
        """

        class SimulationID(BaseSchema):
            """Validates `simulation_id` path parameter for simulation routes."""
            simulation_id: int

    class QueryArgs:
        """Namespace for query parameter Pydantic models.

        Each nested class defines the expected query string parameters
        for a specific endpoint. Default values enable optional params
        while leveraging Pydantic's type coercion (e.g., '"10"' -> int).
        """

        class SimulationInit(BaseSchema):
            """Query schema for the simulation initialization endpoint.

            Parameters
            ----------
            initial_agents: int
                Number of agents to seed initially. Defaults to 10.
            concurrent_agents_allowed: int
                Upper bound on concurrently active agents. Defaults to 10.
            start_simulation: bool
                Whether the simulation worker process should start
                immediately after creation. Defaults to True.

            Notes
            -----
            * Additional simulation tuning parameters can be added here
              later without changing the decorator usages.
            * Pydantic performs standard type coercion (bool, int, etc.)
              which simplifies handling of raw str query inputs.

            Example
            -------
            /simulation/initialize?initial_agents=25&start_simulation=false
            """
            initial_agents: int = 10
            concurrent_agents_allowed: int = 10
            start_simulation: bool = True

    class BodyArgs:
        """Placeholder namespace for JSON body schemas.

        Define Pydantic models here for endpoints expecting JSON payloads.
        Using a separate namespace clarifies intent vs query/path params.
        """
        pass

    class Parse:
        """Decorator factories for integrating schema validation with Flask.

        Each factory returns a decorator that wraps a view function. The
        wrapper extracts raw data (query args, JSON body, or path params),
        instantiates the provided Pydantic schema, and either forwards the
        validated object to the view or returns a 422 response detailing
        validation errors.

        Error Handling
        --------------
        Validation failures emit structured JSON containing the Pydantic
        error list. HTTP 422 is used (vs 400) to emphasize that the
        request was syntactically valid but semantically invalid per
        declared schema constraints.
        """

        P = ParamSpec("P")
        R = TypeVar("R")
        ViewFunc = Callable[..., ResponseReturnValue]

        @classmethod
        def query_args(cls, schema: Type[BaseSchema]) -> Callable[[ViewFunc], ViewFunc]:
            """Validate query string parameters against a Pydantic schema.

            The decorated view receives the parsed schema instance as the
            first positional argument, followed by original *args/**kwargs.

            Parameters
            ----------
            schema: Type[BaseSchema]
                Pydantic model defining expected query parameters.

            Returns
            -------
            Callable
                A decorator which wraps a Flask view function.
            """

            def decorator(f: Schemas.Parse.ViewFunc) -> Schemas.Parse.ViewFunc:
                @wraps(f)
                def wrapper(*args: Any, **kwargs: Any) -> ResponseReturnValue:
                    # Convert MultiDict of query parameters to a plain dict
                    # enabling direct unpacking into the Pydantic schema.
                    raw: Dict[str, Any] = request.args.to_dict()
                    try:
                        parsed: BaseSchema = schema(**raw)
                    except ValidationError as e:  # 422 for semantic validation errors
                        return jsonify({
                            "error": e.errors(),
                            "message": "Invalid query parameters"
                        }), 422
                    return f(parsed, *args, **kwargs)

                return wrapper

            return decorator

        @classmethod
        def json_body(cls, schema: Type[BaseSchema]) -> Callable[[ViewFunc], ViewFunc]:
            """Validate JSON request body against a Pydantic schema.

            Silent JSON parsing avoids raising an error when Content-Type
            is missing or body is empty; an empty dict is then validated
            against the schema allowing defaults to populate.
            """

            def decorator(f: Schemas.Parse.ViewFunc) -> Schemas.Parse.ViewFunc:
                @wraps(f)
                def wrapper(*args: Any, **kwargs: Any) -> ResponseReturnValue:
                    # get_json(silent=True) returns None on malformed JSON or missing content type.
                    raw: Dict[str, Any] = request.get_json(silent=True) or {}
                    try:
                        parsed: BaseSchema = schema(**raw)
                    except ValidationError as e:  # 422 preserves semantic error distinction.
                        return jsonify({"errors": e.errors()}), 422
                    return f(parsed, *args, **kwargs)

                return wrapper

            return decorator

        @classmethod
        def path_args(cls, schema: Type[BaseSchema]) -> Callable[[ViewFunc], ViewFunc]:
            """Validate dynamic path parameters extracted from the URL.

            Flask stores matched path variables in request.view_args. They
            are copied into a dict and passed to the schema for validation.
            """

            def decorator(f: Schemas.Parse.ViewFunc) -> Schemas.Parse.ViewFunc:
                @wraps(f)
                def wrapper(*args: Any, **kwargs: Any) -> ResponseReturnValue:
                    raw: Dict[str, Any] = dict(request.view_args or {})
                    try:
                        parsed: BaseSchema = schema(**raw)
                    except ValidationError as e:
                        return jsonify({
                            "errors": e.errors(),
                            "message": "Invalid path parameters"
                        }), 422
                    return f(parsed, *args, **kwargs)

                return wrapper

            return decorator

        @classmethod
        def get(cls, schema: Type[BaseSchema], source: Any) -> BaseSchema:
            """Manually parse arbitrary mapping-like data into a schema.

            Useful for tests or ad-hoc validation outside of request
            contexts. Accepts objects with a .to_dict() method or any
            mapping / iterable of key-value pairs coercible to dict().

            Parameters
            ----------
            schema: Type[BaseSchema]
                Target Pydantic model.
            source: Any
                Source data convertible to a dict via to_dict() or dict().

            Returns
            -------
            BaseSchema
                Instantiated and validated Pydantic model.
            """
            raw: Dict[str, Any] = source.to_dict() if hasattr(source, "to_dict") else dict(source)
            return schema(**raw)
