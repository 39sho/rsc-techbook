import { Suspense } from "react";
import { Action } from "./Action";
import { ActionFn, FormActionFn } from "./ActionFn";
import { Counter } from "./Counter";
import { Sleep } from "./Sleep";

const App = () => {
	const promise = new Promise((resolve, _reject) => setTimeout(resolve, 5000));

	return (
		<div>
			<div>Hello!</div>
			<Suspense fallback="loading...">
				<Counter sleep={promise} />
			</Suspense>
			<Action action={ActionFn} />
			<Suspense fallback="sleeping...">
				<Sleep />
			</Suspense>
			<form action={FormActionFn}>
				<button type="submit">action [form]</button>
			</form>
		</div>
	);
};

export { App };
